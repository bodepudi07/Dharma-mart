import express from 'express';
import { authenticate, authorize } from './middleware/auth.js';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// Apply auth middleware to all admin routes
router.use(authenticate);
router.use(authorize(['admin']));

// GET all users
router.get('/users', async (req, res) => {
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
router.get('/stats', async (req, res) => {
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

        res.json({
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
router.post('/process-temple', async (req, res, next) => {
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
router.put('/users/:id/role', async (req, res, next) => {
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

export default router;
