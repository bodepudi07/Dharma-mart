import express from 'express';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';

const router = express.Router();

// GET user chat history
router.get('/history/:userId', authenticate, async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const histories = await db.read('chat_history.json');
        const userHistory = histories.find(h => h.userId === userId);
        res.json(userHistory ? userHistory.messages : []);
    } catch (error) {
        console.error('API Error: /chats/history', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
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
        res.json({ message: 'History saved successfully' });
    } catch (error) {
        console.error('API Error: /chats/history/save', error);
        res.status(500).json({ error: 'Failed to save history' });
    }
});

// GET saved insights (bookmarks)
router.get('/bookmarks/:userId', authenticate, async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const allBookmarks = await db.read('bookmarks.json');
        const userBookmarks = allBookmarks.filter(b => b.userId === userId);
        res.json(userBookmarks);
    } catch (error) {
        console.error('API Error: /chats/bookmarks', error);
        res.status(500).json({ error: 'Failed to fetch bookmarks' });
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
        res.json({ message: 'Insight bookmarked successfully', bookmark: newBookmark });
    } catch (error) {
        console.error('API Error: POST /chats/bookmarks', error);
        res.status(500).json({ error: 'Failed to save bookmark' });
    }
});

// DELETE bookmark
router.delete('/bookmarks/:id', authenticate, async (req, res) => {
    const bookmarkId = parseInt(req.params.id);
    const userId = req.user.id;

    try {
        let bookmarks = await db.read('bookmarks.json');
        const index = bookmarks.findIndex(b => b.id === bookmarkId && (b.userId === userId || req.user.role === 'admin'));

        if (index === -1) return res.status(404).json({ error: 'Bookmark not found' });

        bookmarks.splice(index, 1);
        await db.write('bookmarks.json', bookmarks);
        res.json({ message: 'Bookmark removed' });
    } catch (error) {
        console.error('API Error: DELETE /chats/bookmarks', error);
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
});

export default router;
