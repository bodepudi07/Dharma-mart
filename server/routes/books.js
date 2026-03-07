import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all books
router.get('/', async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const query = {};

        if (limit) query.limit = parseInt(limit);
        if (offset) query.offset = parseInt(offset);

        const books = await db.find('books.json', query);
        res.json(books);
    } catch (error) {
        console.error('API Error: /books', error);
        res.status(500).json({ error: 'Failed to fetch books' });
    }
});

// GET book by ID
router.get('/:id', async (req, res) => {
    try {
        const bookId = parseInt(req.params.id);
        const book = await db.findOne('books.json', b => b.id === bookId);

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json(book);
    } catch (error) {
        console.error('API Error: /books/:id', error);
        res.status(500).json({ error: 'Failed to fetch book' });
    }
});

export default router;