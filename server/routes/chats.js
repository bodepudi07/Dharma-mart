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

// GET user chat history
router.get('/history/:userId', authenticate, async (req, res) => {
    const userId = parseInt(req.params.userId);
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const histories = await readDataFile('chat_history.json');
        const userHistory = histories.find(h => h.userId === userId);
        res.json(userHistory ? userHistory.messages : []);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// SAVE user chat message
router.post('/history', authenticate, async (req, res) => {
    const { messages } = req.body;
    const userId = req.user.id;

    try {
        let histories = await readDataFile('chat_history.json');
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

        await writeDataFile('chat_history.json', histories);
        res.json({ message: 'History saved successfully' });
    } catch (error) {
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
        const allBookmarks = await readDataFile('bookmarks.json');
        const userBookmarks = allBookmarks.filter(b => b.userId === userId);
        res.json(userBookmarks);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookmarks' });
    }
});

// SAVE bookmark
router.post('/bookmarks', authenticate, async (req, res) => {
    const { text, context } = req.body;
    const userId = req.user.id;

    try {
        const bookmarks = await readDataFile('bookmarks.json');
        const newBookmark = {
            id: Date.now(),
            userId,
            text,
            context,
            timestamp: new Date().toISOString()
        };
        bookmarks.push(newBookmark);
        await writeDataFile('bookmarks.json', bookmarks);
        res.json({ message: 'Insight bookmarked successfully', bookmark: newBookmark });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save bookmark' });
    }
});

// DELETE bookmark
router.delete('/bookmarks/:id', authenticate, async (req, res) => {
    const bookmarkId = parseInt(req.params.id);
    const userId = req.user.id;

    try {
        let bookmarks = await readDataFile('bookmarks.json');
        const index = bookmarks.findIndex(b => b.id === bookmarkId && (b.userId === userId || req.user.role === 'admin'));

        if (index === -1) return res.status(404).json({ error: 'Bookmark not found' });

        bookmarks.splice(index, 1);
        await writeDataFile('bookmarks.json', bookmarks);
        res.json({ message: 'Bookmark removed' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to remove bookmark' });
    }
});

export default router;
