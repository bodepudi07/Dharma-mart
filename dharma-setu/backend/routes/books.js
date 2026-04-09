import express from 'express';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const { limit, offset } = req.query;
        const query = {};
        if (limit) query.limit = parseInt(limit);
        if (offset) query.offset = parseInt(offset);
        const books = await db.find('books.json', query);
        return standardResponse(res, 200, books);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const bookId = parseInt(req.params.id);
        if (isNaN(bookId)) return errorResponse(res, 400, 'Invalid book ID');
        const book = await db.findOne('books.json', b => b.id === bookId);
        if (!book) return errorResponse(res, 404, 'Book not found');
        return standardResponse(res, 200, book);
    } catch (error) {
        next(error);
    }
});

export default router;