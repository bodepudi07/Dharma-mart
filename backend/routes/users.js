import express from 'express';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
    const updates = req.body;
    try {
        const { role, passwordHash, id, ...safeUpdates } = updates;
        const updatedUser = await db.update('users.json', req.user.id, safeUpdates);

        if (!updatedUser) return errorResponse(res, 404, 'User not found');

        const { passwordHash: _, ...userWithoutPass } = updatedUser;
        return standardResponse(res, 200, { user: userWithoutPass }, 'Profile updated successfully');
    } catch (error) {
        next(error);
    }
});

// Toggle follow user
router.post('/follow/:targetId', authenticate, async (req, res) => {
    const targetId = parseInt(req.params.targetId);
    if (req.user.id === targetId) return errorResponse(res, 400, 'Cannot follow yourself');

    try {
        const users = await db.read('users.json');
        const currentUserIndex = users.findIndex(u => u.id === req.user.id);
        const targetUserIndex = users.findIndex(u => u.id === targetId);

        if (currentUserIndex === -1 || targetUserIndex === -1) return errorResponse(res, 404, 'User not found');

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
        return standardResponse(res, 200, null, isFollowing ? 'Unfollowed' : 'Followed');
    } catch (error) {
        next(error);
    }
});

export default router;
