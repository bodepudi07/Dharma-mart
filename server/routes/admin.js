import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticate, authorize } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Helper functions
const readDataFile = async (filename) => {
    try {
        const dataPath = path.join(__dirname, '../../data', filename);
        const data = await fs.readFile(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error);
        return [];
    }
};

const writeDataFile = async (filename, data) => {
    try {
        const dataPath = path.join(__dirname, '../../data', filename);
        await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing ${filename}:`, error);
        throw error;
    }
};

// Apply auth middleware to all admin routes
router.use(authenticate);
router.use(authorize(['admin']));

// GET all users
router.get('/users', async (req, res) => {
    try {
        const users = await readDataFile('users.json');
        // Return user data without password hashes
        const usersWithoutPasswords = users.map(u => {
            const { password, passwordHash, ...userWithoutPassword } = u;
            return userWithoutPassword;
        });
        res.json(usersWithoutPasswords);
    } catch (error) {
        res.status(500).json({ error: 'Failed to Fetch users' });
    }
});

// GET activity log
router.get('/activity-log', async (req, res) => {
    try {
        const logs = await readDataFile('activity_log.json');
        res.json(logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity log' });
    }
});

// GET admin stats
router.get('/stats', async (req, res) => {
    try {
        const [users, bookings, temples, poojas, yatras, events, pandits, books, festivals] = await Promise.all([
            readDataFile('users.json'),
            readDataFile('bookings.json'),
            readDataFile('temples.json'),
            readDataFile('poojas.json'),
            readDataFile('yatras.json'),
            readDataFile('events.json'),
            readDataFile('pandits.json'),
            readDataFile('books.json'),
            readDataFile('festivals.json')
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
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET pending temples
router.get('/pending-temples', async (req, res) => {
    try {
        const temples = await readDataFile('pending_temples.json');
        res.json(temples);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending temples' });
    }
});

// GET pending pandits
router.get('/pending-pandits', async (req, res) => {
    try {
        const pandits = await readDataFile('pending_pandits.json');
        res.json(pandits);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending pandits' });
    }
});

// Process temple submission
router.post('/process-temple', async (req, res) => {
    const { templeId, status } = req.body;
    try {
        let pending = await readDataFile('pending_temples.json');
        const submission = pending.find(t => t.id === templeId);
        if (!submission) return res.status(404).json({ error: 'Submission not found' });

        pending = pending.filter(t => t.id !== templeId);
        await writeDataFile('pending_temples.json', pending);

        if (status === 'approved') {
            const temples = await readDataFile('temples.json');
            const { submittedBy, status: _, ...newTemple } = submission;
            temples.push({ ...newTemple, id: temples.length > 0 ? Math.max(...temples.map(t => t.id)) + 1 : 1 });
            await writeDataFile('temples.json', temples);
            res.json({ message: 'Temple approved and added successfully' });
        } else {
            res.json({ message: 'Temple submission rejected' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to process temple submission' });
    }
});

// Update user role
router.put('/users/:id/role', async (req, res) => {
    const { role } = req.body;
    const userId = parseInt(req.params.id);
    try {
        const users = await readDataFile('users.json');
        const index = users.findIndex(u => u.id === userId);
        if (index === -1) return res.status(404).json({ error: 'User not found' });

        users[index].role = role;
        await writeDataFile('users.json', users);
        res.json({ message: `Role for ${users[index].name} updated to ${role}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

const cascadeDeleteUserData = async (userId) => {
    const files = ['bookings.json', 'activity_log.json', 'chat_messages.json', 'posts.json', 'user_preferences.json'];
    for (const file of files) {
        try {
            let data = await readDataFile(file);
            if (Array.isArray(data)) {
                const newData = data.filter(item => item.userId !== userId);
                if (data.length !== newData.length) {
                    await writeDataFile(file, newData);
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
        let users = await readDataFile('users.json');
        const user = users.find(u => u.id === userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        await cascadeDeleteUserData(userId);

        users = users.filter(u => u.id !== userId);
        await writeDataFile('users.json', users);
        res.json({ message: `User ${user.name} and all associated data deleted successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Approve Pandit
router.post('/approve-pandit/:id', async (req, res) => {
    const panditId = parseInt(req.params.id);
    try {
        const pending = await readDataFile('pending_pandits.json');
        const pandit = pending.find(p => p.id === panditId);
        if (!pandit) return res.status(404).json({ error: 'Pending pandit not found' });

        const newPending = pending.filter(p => p.id !== panditId);
        await writeDataFile('pending_pandits.json', newPending);

        const verified = await readDataFile('pandits.json');
        verified.push({ ...pandit, status: 'verified', rating: 4.5 });
        await writeDataFile('pandits.json', verified);

        res.json({ message: 'Pandit approved and verified' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to approve pandit' });
    }
});

// Reject Pandit
router.post('/reject-pandit/:id', async (req, res) => {
    const panditId = parseInt(req.params.id);
    try {
        const pending = await readDataFile('pending_pandits.json');
        const newPending = pending.filter(p => p.id !== panditId);
        await writeDataFile('pending_pandits.json', newPending);
        res.json({ message: 'Pandit registration rejected' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reject pandit' });
    }
});

export default router;
