import express from 'express';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// GET all posts (sorted by newest first)
router.get('/', async (req, res, next) => {
    try {
        const posts = await db.read('posts.json');
        const sorted = posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        return standardResponse(res, 200, sorted);
    } catch (error) {
        next(error);
    }
});

// POST create a new post
router.post('/', authenticate, async (req, res, next) => {
    const { caption, imageUrl } = req.body;
    if (!caption) return errorResponse(res, 400, 'Caption is required');

    try {
        const newPost = {
            id: Date.now(),
            userId: req.user.id,
            userName: req.user.name,
            imageUrl: imageUrl || '',
            caption,
            timestamp: new Date().toISOString(),
            likes: [],
            comments: [],
        };
        await db.insert('posts.json', newPost);

        await db.insert('activity_log.json', {
            id: Date.now() + 1,
            type: 'addition',
            message: `User '${req.user.name}' created a new post.`,
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });

        return standardResponse(res, 201, newPost, 'Post created successfully!');
    } catch (error) {
        next(error);
    }
});

// POST toggle like on a post
router.post('/:postId/like', authenticate, async (req, res, next) => {
    const postId = parseInt(req.params.postId);
    try {
        const posts = await db.read('posts.json');
        const postIndex = posts.findIndex(p => p.id === postId);
        if (postIndex === -1) return errorResponse(res, 404, 'Post not found');

        const userId = req.user.id;
        const liked = posts[postIndex].likes.includes(userId);
        if (liked) {
            posts[postIndex].likes = posts[postIndex].likes.filter(id => id !== userId);
        } else {
            posts[postIndex].likes.push(userId);
        }

        await db.write('posts.json', posts);
        return standardResponse(res, 200, null, liked ? 'Post unliked' : 'Post liked');
    } catch (error) {
        next(error);
    }
});

export default router;
