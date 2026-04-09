import express from 'express';
import joi from 'joi';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

const submitTempleSchema = joi.object({
    name: joi.string().required(),
    location: joi.string().required(),
    deity: joi.string().allow('', null),
    description: joi.string().allow('', null),
    imageUrl: joi.string().uri().allow('', null),
}).unknown(true);

const submitPanditSchema = joi.object({
    name: joi.string().required(),
    specialization: joi.string().allow('', null),
    phone: joi.string().allow('', null),
    location: joi.string().allow('', null),
}).unknown(true);

const yatraQuoteSchema = joi.object({
    yatraId: joi.number().integer().required(),
    groupSize: joi.number().integer().min(1).required(),
    preferredDate: joi.string().allow('', null),
    message: joi.string().allow('', null),
}).unknown(true);

// Update user profile
router.put('/profile', authenticate, async (req, res, next) => {
    const updates = req.body;
    try {
        const { role, passwordHash, password, id, ...safeUpdates } = updates;
        const updatedUser = await db.update('users.json', req.user.id, safeUpdates);

        if (!updatedUser) return errorResponse(res, 404, 'User not found');

        const { passwordHash: _ph, password: _pw, ...userWithoutPass } = updatedUser;
        return standardResponse(res, 200, { user: userWithoutPass }, 'Profile updated successfully');
    } catch (error) {
        next(error);
    }
});

// Toggle follow user
router.post('/follow/:targetId', authenticate, async (req, res, next) => {
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

// --- User Preferences ---

// GET user preferences
router.get('/preferences/:userId', authenticate, async (req, res, next) => {
    const userId = parseInt(req.params.userId);
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return errorResponse(res, 403, 'Access denied');
    }

    try {
        const allPrefs = await db.read('user_preferences.json');
        const userPrefs = allPrefs.find(p => p.userId === userId);
        return standardResponse(res, 200, userPrefs ? userPrefs.preferences : {});
    } catch (error) {
        next(error);
    }
});

// PUT update user preferences (e.g., chant images)
router.put('/preferences', authenticate, async (req, res, next) => {
    const { chantId, imageData } = req.body;

    try {
        const allPrefs = await db.read('user_preferences.json');
        let userPrefs = allPrefs.find(p => p.userId === req.user.id);

        if (!userPrefs) {
            userPrefs = { id: Date.now(), userId: req.user.id, preferences: {} };
            allPrefs.push(userPrefs);
        }

        if (chantId !== undefined && imageData !== undefined) {
            if (!userPrefs.preferences.chantImages) {
                userPrefs.preferences.chantImages = {};
            }
            userPrefs.preferences.chantImages[chantId] = imageData;
        } else {
            // Generic preferences update
            const { chantId: _c, imageData: _i, ...otherPrefs } = req.body;
            userPrefs.preferences = { ...userPrefs.preferences, ...otherPrefs };
        }

        await db.write('user_preferences.json', allPrefs);
        return standardResponse(res, 200, userPrefs, 'Preferences updated successfully');
    } catch (error) {
        next(error);
    }
});

// --- Submissions ---

// POST submit a temple for review
router.post('/submit-temple', authenticate, validateRequest(submitTempleSchema), async (req, res, next) => {
    try {
        const newSubmission = {
            ...req.body,
            id: Date.now(),
            lat: 0,
            lng: 0,
            crowdLevel: 'Medium',
            deity: req.body.deity || 'Unknown',
            submittedBy: req.user.email,
            status: 'pending',
            estimatedCost: 0,
            estimatedDays: 0,
        };
        await db.insert('pending_temples.json', newSubmission);

        await db.insert('activity_log.json', {
            id: Date.now() + 1,
            type: 'submission',
            message: `Submitted new temple for review: ${req.body.name}.`,
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });

        return standardResponse(res, 201, null, 'Temple submitted for review. Thank you for your contribution!');
    } catch (error) {
        next(error);
    }
});

// POST submit pandit registration
router.post('/submit-pandit', authenticate, validateRequest(submitPanditSchema), async (req, res, next) => {
    try {
        const newSubmission = {
            ...req.body,
            id: Date.now(),
            status: 'pending',
            rating: 0,
        };
        await db.insert('pending_pandits.json', newSubmission);

        await db.insert('activity_log.json', {
            id: Date.now() + 1,
            type: 'submission',
            message: `New pandit registration from ${req.body.name}.`,
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });

        return standardResponse(res, 201, null, 'Your application has been submitted for review. We will contact you shortly.');
    } catch (error) {
        next(error);
    }
});

// POST submit yatra quote request
router.post('/yatra-quote', authenticate, validateRequest(yatraQuoteSchema), async (req, res, next) => {
    try {
        const quote = { ...req.body, id: Date.now(), userId: req.user.id, timestamp: new Date().toISOString() };
        await db.insert('yatra_quotes.json', quote);

        await db.insert('activity_log.json', {
            id: Date.now() + 1,
            type: 'submission',
            message: 'Submitted a custom yatra quote request.',
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });

        return standardResponse(res, 201, null, 'Your custom yatra plan has been submitted! Our partners will contact you shortly.');
    } catch (error) {
        next(error);
    }
});

// POST log activity
router.post('/activity', authenticate, async (req, res, next) => {
    const { type, message } = req.body;
    try {
        await db.insert('activity_log.json', {
            id: Date.now(),
            type: type || 'general',
            message,
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });
        return standardResponse(res, 201, null, 'Activity logged');
    } catch (error) {
        next(error);
    }
});

export default router;
