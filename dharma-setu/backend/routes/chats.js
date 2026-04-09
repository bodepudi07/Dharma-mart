import express from 'express';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// ==========================================
// SATSANG COMMUNITY CHAT - Real-time Group Chat
// ==========================================

// In-memory presence tracking (users currently in rooms)
const roomPresence = new Map(); // roomId -> Map<userId, { user, lastSeen }>
const PRESENCE_TIMEOUT = 30000; // 30 seconds

function cleanStalePresence() {
    const now = Date.now();
    for (const [roomId, users] of roomPresence) {
        for (const [userId, entry] of users) {
            if (now - entry.lastSeen > PRESENCE_TIMEOUT) {
                users.delete(userId);
            }
        }
        if (users.size === 0) roomPresence.delete(roomId);
    }
}

// GET satsang rooms with live stats
router.get('/satsang/rooms', async (req, res, next) => {
    try {
        const rooms = await db.read('chat_rooms.json');
        const messages = await db.read('satsang_messages.json');
        cleanStalePresence();

        const enrichedRooms = rooms.map(room => {
            const roomMsgs = messages.filter(m => m.roomId === room.id);
            const lastMsg = roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : null;
            const presence = roomPresence.get(room.id);
            const onlineCount = presence ? presence.size : 0;

            let lastActive = room.lastActive || 'No messages yet';
            if (lastMsg) {
                const diff = Date.now() - new Date(lastMsg.timestamp).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 1) lastActive = 'Just now';
                else if (mins < 60) lastActive = `${mins} min${mins > 1 ? 's' : ''} ago`;
                else if (mins < 1440) lastActive = `${Math.floor(mins / 60)} hr${Math.floor(mins / 60) > 1 ? 's' : ''} ago`;
                else lastActive = `${Math.floor(mins / 1440)} day${Math.floor(mins / 1440) > 1 ? 's' : ''} ago`;
            }

            return {
                ...room,
                lastActive,
                onlineCount,
                messageCount: roomMsgs.length,
            };
        });

        return standardResponse(res, 200, enrichedRooms);
    } catch (error) {
        next(error);
    }
});

// GET messages for a room (paginated)
router.get('/satsang/rooms/:roomId/messages', async (req, res, next) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const before = req.query.before ? parseInt(req.query.before) : null;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);

        let messages = await db.read('satsang_messages.json');
        messages = messages.filter(m => m.roomId === roomId);

        if (before) {
            messages = messages.filter(m => m.id < before);
        }

        // Return latest messages (last N)
        const result = messages.slice(-limit);
        return standardResponse(res, 200, result);
    } catch (error) {
        next(error);
    }
});

// POST a message in a room (authenticated)
router.post('/satsang/rooms/:roomId/messages', authenticate, async (req, res, next) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const { text } = req.body;

        if (!text || typeof text !== 'string' || text.trim().length === 0) {
            return errorResponse(res, 400, 'Message text is required');
        }
        if (text.trim().length > 2000) {
            return errorResponse(res, 400, 'Message too long (max 2000 characters)');
        }

        // Verify room exists
        const rooms = await db.read('chat_rooms.json');
        if (!rooms.find(r => r.id === roomId)) {
            return errorResponse(res, 404, 'Chat room not found');
        }

        const newMessage = {
            id: Date.now(),
            roomId,
            userId: req.user.id,
            userName: req.user.name || 'Seeker',
            userAvatar: req.user.avatarUrl || null,
            timestamp: new Date().toISOString(),
            text: text.trim(),
        };

        await db.insert('satsang_messages.json', newMessage);

        // Update presence
        if (!roomPresence.has(roomId)) roomPresence.set(roomId, new Map());
        roomPresence.get(roomId).set(req.user.id, {
            user: { id: req.user.id, name: req.user.name, avatarUrl: req.user.avatarUrl },
            lastSeen: Date.now()
        });

        return standardResponse(res, 201, newMessage, 'Message sent');
    } catch (error) {
        next(error);
    }
});

// POST heartbeat / join room (authenticated) - for presence tracking
router.post('/satsang/rooms/:roomId/presence', authenticate, async (req, res, next) => {
    try {
        const roomId = parseInt(req.params.roomId);

        if (!roomPresence.has(roomId)) roomPresence.set(roomId, new Map());
        roomPresence.get(roomId).set(req.user.id, {
            user: { id: req.user.id, name: req.user.name, avatarUrl: req.user.avatarUrl },
            lastSeen: Date.now()
        });

        cleanStalePresence();

        const presence = roomPresence.get(roomId);
        const onlineUsers = presence ? Array.from(presence.values()).map(e => e.user) : [];

        return standardResponse(res, 200, onlineUsers);
    } catch (error) {
        next(error);
    }
});

// DELETE presence (leave room)
router.delete('/satsang/rooms/:roomId/presence', authenticate, async (req, res, next) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const presence = roomPresence.get(roomId);
        if (presence) presence.delete(req.user.id);
        return standardResponse(res, 200, null, 'Left room');
    } catch (error) {
        next(error);
    }
});

// GET new messages since a given message ID (for polling)
router.get('/satsang/rooms/:roomId/messages/since/:lastId', async (req, res, next) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const lastId = parseInt(req.params.lastId);

        const messages = await db.read('satsang_messages.json');
        const newMessages = messages.filter(m => m.roomId === roomId && m.id > lastId);

        return standardResponse(res, 200, newMessages);
    } catch (error) {
        next(error);
    }
});


// ==========================================
// AI GURU CHAT - Personal Chat History
// ==========================================

// GET user chat history
router.get('/history/:userId', authenticate, async (req, res, next) => {
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
router.post('/history', authenticate, async (req, res, next) => {
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
router.get('/bookmarks/:userId', authenticate, async (req, res, next) => {
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
router.post('/bookmarks', authenticate, async (req, res, next) => {
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
router.delete('/bookmarks/:id', authenticate, async (req, res, next) => {
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
