import express from 'express';
import { authenticate, authorize } from './middleware/auth.js';
import db from '../db.js';

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
        res.json(usersWithoutPasswords);
    } catch (error) {
        console.error('API Error: /admin/users', error);
        res.status(500).json({ error: 'Failed to Fetch users' });
    }
});

// GET activity log
router.get('/activity-log', async (req, res) => {
    try {
        const logs = await db.read('activity_log.json');
        res.json(logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity log' });
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
        console.error('API Error: /admin/stats', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET pending temples
router.get('/pending-temples', async (req, res) => {
    try {
        const temples = await db.read('pending_temples.json');
        res.json(temples);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending temples' });
    }
});

// GET pending pandits
router.get('/pending-pandits', async (req, res) => {
    try {
        const pandits = await db.read('pending_pandits.json');
        res.json(pandits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending pandits' });
    }
});

// Process temple submission
router.post('/process-temple', async (req, res) => {
    const { templeId, status } = req.body;
    try {
        let pending = await db.read('pending_temples.json');
        const submission = pending.find(t => t.id === templeId);
        if (!submission) return res.status(404).json({ error: 'Submission not found' });

        pending = pending.filter(t => t.id !== templeId);
        await db.write('pending_temples.json', pending);

        if (status === 'approved') {
            const { submittedBy, status: _, ...newTemple } = submission;
            await db.insert('temples.json', newTemple);
            res.json({ message: 'Temple approved and added successfully' });
        } else {
            res.json({ message: 'Temple submission rejected' });
        }
    } catch (error) {
        console.error('API Error: /admin/process-temple', error);
        res.status(500).json({ error: 'Failed to process temple submission' });
    }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
    const { role } = req.body;
    const userId = parseInt(req.params.id);
    try {
        const updatedUser = await db.update('users.json', userId, { role });
        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        res.json({ message: `Role for ${updatedUser.name} updated to ${role}` });
    } catch (error) {
        console.error('API Error: /admin/users/:id/role', error);
        res.status(500).json({ error: 'Failed to update user role' });
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
router.delete('/users/:id', async (req, res) => {
    const userId = parseInt(req.params.id);
    try {
        const user = await db.findOne('users.json', u => u.id === userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await cascadeDeleteUserData(userId);

        await db.delete('users.json', userId);
        res.json({ message: `User ${user.name} and all associated data deleted successfully` });
    } catch (error) {
        console.error('API Error: DELETE /admin/users', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Approve Pandit
router.post('/approve-pandit/:id', async (req, res) => {
    const panditId = parseInt(req.params.id);
    try {
        const pending = await db.read('pending_pandits.json');
        const pandit = pending.find(p => p.id === panditId);
        if (!pandit) return res.status(404).json({ error: 'Pending pandit not found' });

        const newPending = pending.filter(p => p.id !== panditId);
        await db.write('pending_pandits.json', newPending);

        await db.insert('pandits.json', { ...pandit, status: 'verified', rating: 4.5 });

        res.json({ message: 'Pandit approved and verified' });
    } catch (error) {
        console.error('API Error: POST /admin/approve-pandit', error);
        res.status(500).json({ error: 'Failed to approve pandit' });
    }
});

// Reject Pandit
router.post('/reject-pandit/:id', async (req, res) => {
    const panditId = parseInt(req.params.id);
    try {
        const pending = await db.read('pending_pandits.json');
        const newPending = pending.filter(p => p.id !== panditId);
        await db.write('pending_pandits.json', newPending);
        res.json({ message: 'Pandit registration rejected' });
    } catch (error) {
        console.error('API Error: POST /admin/reject-pandit', error);
        res.status(500).json({ error: 'Failed to reject pandit' });
    }
});

export default router;
