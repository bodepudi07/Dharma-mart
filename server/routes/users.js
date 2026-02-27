import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticate } from './middleware/auth.js';

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
        return [];
    }
};

const writeDataFile = async (filename, data) => {
    const dataPath = path.join(__dirname, '../../data', filename);
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
};

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    const updates = req.body;
    try {
        const users = await readDataFile('users.json');
        const userIndex = users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

        // Security: Don't allow updating sensitive fields like role or passwordHash here
        const { role, passwordHash, id, ...safeUpdates } = updates;
        users[userIndex] = { ...users[userIndex], ...safeUpdates };

        await writeDataFile('users.json', users);
        const { passwordHash: _, ...userWithoutPass } = users[userIndex];
        res.json({ message: 'Profile updated successfully', user: userWithoutPass });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Toggle follow user
router.post('/follow/:targetId', authenticate, async (req, res) => {
    const targetId = parseInt(req.params.targetId);
    if (req.user.id === targetId) return res.status(400).json({ error: 'Cannot follow yourself' });

    try {
        const users = await readDataFile('users.json');
        const currentUserIndex = users.findIndex(u => u.id === req.user.id);
        const targetUserIndex = users.findIndex(u => u.id === targetId);

        if (currentUserIndex === -1 || targetUserIndex === -1) return res.status(404).json({ error: 'User not found' });

        const currentUser = users[currentUserIndex];
        const targetUser = users[targetUserIndex];

        if (!currentUser.following) currentUser.following = [];
        if (!targetUser.followers) targetUser.followers = [];

        const isFollowing = currentUser.following.includes(targetId);
        if (isFollowing) {
            currentUser.following = currentUser.following.filter(id => id !== targetId);
            targetUser.followers = targetUser.followers.filter(id => id !== req.user.id);
        } else {
            currentUser.following.push(targetId);
            targetUser.followers.push(req.user.id);
        }

        await writeDataFile('users.json', users);
        res.json({ message: isFollowing ? 'Unfollowed' : 'Followed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle follow' });
    }
});

export default router;
