import express from 'express';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// GET user chat history
router.get('/history/:userId', authenticate, async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return errorResponse(res, 403, 'Access denied');
    }

    try {
        const histories = await db.read('chat_history.json');
        const userHistory = histories.find(h => h.userId === userId);
        return standardResponse(res, 200, userHistory ? userHistory.messages : []);
    } catch (error) {
        next(error);
    }
});

// SAVE user chat message
router.post('/history', authenticate, async (req, res) => {
    const { messages } = req.body;
    const userId = req.user.id;

    try {
        let histories = await db.read('chat_history.json');
        const index = histories.findIndex(h => h.userId === userId);

        if (index > -1) {
            histories[index].messages = messages;
            histories[index].lastUpdated = new Date().toISOString();
        } else {
            histories.push({
                userId,
                messages,
                lastUpdated: new Date().toISOString()
            });
        }

        await db.write('chat_history.json', histories);
        return standardResponse(res, 200, null, 'History saved successfully');
    } catch (error) {
        next(error);
    }
});

// GET saved insights (bookmarks)
router.get('/bookmarks/:userId', authenticate, async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return errorResponse(res, 403, 'Access denied');
    }

    try {
        const allBookmarks = await db.read('bookmarks.json');
        const userBookmarks = allBookmarks.filter(b => b.userId === userId);
        return standardResponse(res, 200, userBookmarks);
    } catch (error) {
        next(error);
    }
});

// SAVE bookmark
router.post('/bookmarks', authenticate, async (req, res) => {
    const { text, context } = req.body;
    const userId = req.user.id;

    try {
        const bookmarks = await db.read('bookmarks.json');
        const newBookmark = {
            id: Date.now(),
            userId,
            text,
            context,
            timestamp: new Date().toISOString()
        };
        await db.insert('bookmarks.json', newBookmark);
        return standardResponse(res, 201, { bookmark: newBookmark }, 'Insight bookmarked successfully');
    } catch (error) {
        next(error);
    }
});

// DELETE bookmark
router.delete('/bookmarks/:id', authenticate, async (req, res) => {
    const bookmarkId = parseInt(req.params.id);
    const userId = req.user.id;

    try {
        let bookmarks = await db.read('bookmarks.json');
        const index = bookmarks.findIndex(b => b.id === bookmarkId && (b.userId === userId || req.user.role === 'admin'));

        if (index === -1) return errorResponse(res, 404, 'Bookmark not found');

        bookmarks.splice(index, 1);
        await db.write('bookmarks.json', bookmarks);
        return standardResponse(res, 200, null, 'Bookmark removed');
    } catch (error) {
        next(error);
    }
});

export default router;
