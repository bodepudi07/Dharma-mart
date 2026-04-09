import express from 'express';
import joi from 'joi';
import { authenticate, authorize } from './middleware/auth.js';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

// Validation schemas
const processTempleSchema = joi.object({
    templeId: joi.number().integer().required(),
    status: joi.string().valid('approved', 'rejected').required()
});

const updateRoleSchema = joi.object({
    role: joi.string().valid('user', 'admin', 'pandit').required()
});

// Apply auth middleware to all admin routes
router.use(authenticate);
router.use(authorize(['admin']));

// GET all users
router.get('/users', async (req, res, next) => {
    try {
        const users = await db.read('users.json');
        // Return user data without password hashes
        const usersWithoutPasswords = users.map(u => {
            const { password, passwordHash, ...userWithoutPassword } = u;
            return userWithoutPassword;
        });
        return standardResponse(res, 200, usersWithoutPasswords);
    } catch (error) {
        next(error);
    }
});

// GET activity log
router.get('/activity-log', async (req, res, next) => {
    try {
        const logs = await db.read('activity_log.json');
        return standardResponse(res, 200, logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
        next(error);
    }
});

// GET all bookings
router.get('/bookings', async (req, res, next) => {
    try {
        const bookings = await db.read('bookings.json');
        return standardResponse(res, 200, bookings);
    } catch (error) {
        next(error);
    }
});

// GET admin stats
router.get('/stats', async (req, res, next) => {
    try {
        const [users, bookings, temples, poojas, yatras, events, pandits, books, festivals] = await Promise.all([
            db.read('users.json'),
            db.read('bookings.json'),
            db.read('temples.json'),
            db.read('poojas.json'),
            db.read('yatras.json'),
            db.read('events.json'),
            db.read('pandits.json'),
            db.read('books.json'),
            db.read('festivals.json')
        ]);

        return standardResponse(res, 200, {
            users: users.length,
            bookings: bookings.length,
            temples: temples.length,
            poojas: poojas.length,
            yatras: yatras.length,
            events: events.length,
            pandits: pandits.length,
            books: books.length,
            festivals: festivals.length
        });
    } catch (error) {
        next(error);
    }
});

// GET pending temples
router.get('/pending-temples', async (req, res, next) => {
    try {
        const temples = await db.read('pending_temples.json');
        return standardResponse(res, 200, temples);
    } catch (error) {
        next(error);
    }
});

// GET pending pandits
router.get('/pending-pandits', async (req, res, next) => {
    try {
        const pandits = await db.read('pending_pandits.json');
        return standardResponse(res, 200, pandits);
    } catch (error) {
        next(error);
    }
});

// Process temple submission
router.post('/process-temple', validateRequest(processTempleSchema), async (req, res, next) => {
    const { templeId, status } = req.body;
    try {
        let pending = await db.read('pending_temples.json');
        const submission = pending.find(t => t.id === templeId);
        if (!submission) return errorResponse(res, 404, 'Submission not found');

        pending = pending.filter(t => t.id !== templeId);
        await db.write('pending_temples.json', pending);

        if (status === 'approved') {
            const { submittedBy, status: _, ...newTemple } = submission;
            await db.insert('temples.json', newTemple);
            return standardResponse(res, 200, null, 'Temple approved and added successfully');
        } else {
            return standardResponse(res, 200, null, 'Temple submission rejected');
        }
    } catch (error) {
        next(error);
    }
});

// Update user role
router.put('/users/:id/role', validateRequest(updateRoleSchema), async (req, res, next) => {
    const { role } = req.body;
    const userId = parseInt(req.params.id);
    try {
        const updatedUser = await db.update('users.json', userId, { role });
        if (!updatedUser) return errorResponse(res, 404, 'User not found');

        return standardResponse(res, 200, null, `Role for ${updatedUser.name} updated to ${role}`);
    } catch (error) {
        next(error);
    }
});

const cascadeDeleteUserData = async (userId) => {
    const files = ['bookings.json', 'activity_log.json', 'chat_messages.json', 'posts.json', 'user_preferences.json'];
    for (const file of files) {
        try {
            let data = await db.read(file);
            if (Array.isArray(data)) {
                const newData = data.filter(item => item.userId !== userId);
                if (data.length !== newData.length) {
                    await db.write(file, newData);
                }
            }
        } catch (error) {
            console.error(`Error cascading delete for ${file}:`, error);
        }
    }
};

// Delete user by admin
router.delete('/users/:id', async (req, res, next) => {
    const userId = parseInt(req.params.id);
    try {
        const user = await db.findOne('users.json', u => u.id === userId);
        if (!user) return errorResponse(res, 404, 'User not found');

        await cascadeDeleteUserData(userId);

        await db.delete('users.json', userId);
        return standardResponse(res, 200, null, `User ${user.name} and all associated data deleted successfully`);
    } catch (error) {
        next(error);
    }
});

// Approve Pandit
router.post('/approve-pandit/:id', async (req, res, next) => {
    const panditId = parseInt(req.params.id);
    try {
        const pending = await db.read('pending_pandits.json');
        const pandit = pending.find(p => p.id === panditId);
        if (!pandit) return errorResponse(res, 404, 'Pending pandit not found');

        const newPending = pending.filter(p => p.id !== panditId);
        await db.write('pending_pandits.json', newPending);

        await db.insert('pandits.json', { ...pandit, status: 'verified', rating: 4.5 });

        return standardResponse(res, 200, null, 'Pandit approved and verified');
    } catch (error) {
        next(error);
    }
});

// Reject Pandit
router.post('/reject-pandit/:id', async (req, res, next) => {
    const panditId = parseInt(req.params.id);
    try {
        const pending = await db.read('pending_pandits.json');
        const newPending = pending.filter(p => p.id !== panditId);
        await db.write('pending_pandits.json', newPending);
        return standardResponse(res, 200, null, 'Pandit registration rejected');
    } catch (error) {
        next(error);
    }
});

// --- Generic CRUD helper for admin entity management ---
const createEntityRoutes = (entityName, collection) => {
    // POST - Add item
    router.post(`/${entityName}`, async (req, res, next) => {
        try {
            const itemData = { ...req.body, id: Date.now() };
            const newItem = await db.insert(collection, itemData);
            await db.insert('activity_log.json', {
                id: Date.now(),
                type: 'addition',
                message: `${entityName} added: "${itemData.name || 'unnamed'}"`,
                userId: req.user.id,
                userName: req.user.name,
                timestamp: new Date().toISOString()
            });
            return standardResponse(res, 201, newItem, `${entityName} added successfully.`);
        } catch (error) {
            next(error);
        }
    });

    // PUT - Update item
    router.put(`/${entityName}/:id`, async (req, res, next) => {
        const itemId = parseInt(req.params.id);
        try {
            const { id, ...updates } = req.body;
            const updated = await db.update(collection, itemId, updates);
            if (!updated) return errorResponse(res, 404, `${entityName} not found`);
            await db.insert('activity_log.json', {
                id: Date.now(),
                type: 'update',
                message: `${entityName} updated: "${updated.name || itemId}"`,
                userId: req.user.id,
                userName: req.user.name,
                timestamp: new Date().toISOString()
            });
            return standardResponse(res, 200, updated, `${entityName} updated successfully.`);
        } catch (error) {
            next(error);
        }
    });

    // DELETE - Delete item
    router.delete(`/${entityName}/:id`, async (req, res, next) => {
        const itemId = parseInt(req.params.id);
        try {
            const deleted = await db.delete(collection, itemId);
            if (!deleted) return errorResponse(res, 404, `${entityName} not found`);
            await db.insert('activity_log.json', {
                id: Date.now(),
                type: 'deletion',
                message: `${entityName} deleted (ID: ${itemId})`,
                userId: req.user.id,
                userName: req.user.name,
                timestamp: new Date().toISOString()
            });
            return standardResponse(res, 200, null, `${entityName} deleted successfully.`);
        } catch (error) {
            next(error);
        }
    });
};

// Register CRUD routes for all entity types
createEntityRoutes('temples', 'temples.json');
createEntityRoutes('poojas', 'poojas.json');
createEntityRoutes('yatras', 'yatras.json');
createEntityRoutes('books', 'books.json');
createEntityRoutes('festivals', 'festivals.json');
createEntityRoutes('events', 'events.json');
createEntityRoutes('pandits', 'pandits.json');

// DELETE event with cascade (also remove associated pandits)
router.delete('/events/:id/cascade', async (req, res, next) => {
    const eventId = parseInt(req.params.id);
    try {
        // Remove associated pandits first
        const pandits = await db.read('pandits.json');
        const filtered = pandits.filter(p => p.eventId !== eventId);
        if (filtered.length !== pandits.length) {
            await db.write('pandits.json', filtered);
        }
        const deleted = await db.delete('events.json', eventId);
        if (!deleted) return errorResponse(res, 404, 'Event not found');
        return standardResponse(res, 200, null, 'Event and associated pandits deleted successfully.');
    } catch (error) {
        next(error);
    }
});

// PUT - Update crowd level for a temple
router.put('/temples/:id/crowd', async (req, res, next) => {
    const templeId = parseInt(req.params.id);
    const { crowdLevel } = req.body;
    try {
        const updated = await db.update('temples.json', templeId, { crowdLevel });
        if (!updated) return errorResponse(res, 404, 'Temple not found');
        await db.insert('activity_log.json', {
            id: Date.now(),
            type: 'update',
            message: `Crowd level for ${updated.name} set to ${crowdLevel}`,
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });
        return standardResponse(res, 200, updated, `Crowd level for ${updated.name} updated.`);
    } catch (error) {
        next(error);
    }
});

// PUT - Update pooja associations for a temple
router.put('/temples/:id/pooja-associations', async (req, res, next) => {
    const templeId = parseInt(req.params.id);
    const { selectedPoojaIds } = req.body;
    try {
        const poojas = await db.read('poojas.json');
        poojas.forEach(pooja => {
            const isSelected = selectedPoojaIds.includes(pooja.id);
            const isAssociated = pooja.templeIds?.includes(templeId);
            if (isSelected && !isAssociated) {
                pooja.templeIds = [...(pooja.templeIds || []), templeId];
            } else if (!isSelected && isAssociated) {
                pooja.templeIds = pooja.templeIds.filter(id => id !== templeId);
            }
        });
        await db.write('poojas.json', poojas);
        return standardResponse(res, 200, null, 'Pooja associations updated successfully.');
    } catch (error) {
        next(error);
    }
});

export default router;
