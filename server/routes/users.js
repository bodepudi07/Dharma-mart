import express from 'express';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';

const router = express.Router();

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    const updates = req.body;
    try {
        const { role, passwordHash, id, ...safeUpdates } = updates;
        const updatedUser = await db.update('users.json', req.user.id, safeUpdates);

        if (!updatedUser) return res.status(404).json({ error: 'User not found' });

        const { passwordHash: _, ...userWithoutPass } = updatedUser;
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
        const users = await db.read('users.json');
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

        await db.write('users.json', users);
        res.json({ message: isFollowing ? 'Unfollowed' : 'Followed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to toggle follow' });
    }
});

export default router;
