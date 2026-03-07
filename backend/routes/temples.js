import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all temples (with optional pagination)
router.get('/', async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const query = {};

        if (limit) query.limit = parseInt(limit);
        if (offset) query.offset = parseInt(offset);

        const temples = await db.find('temples.json', query);
        res.json(temples);
    } catch (error) {
        console.error('API Error: /temples', error);
        res.status(500).json({ error: 'Failed to fetch temples' });
    }
});

// GET temple by ID
router.get('/:id', async (req, res) => {
    try {
        const templeId = parseInt(req.params.id);
        const temple = await db.findOne('temples.json', t => t.id === templeId);

        if (!temple) {
            return res.status(404).json({ error: 'Temple not found' });
        }

        res.json(temple);
    } catch (error) {
        console.error('API Error: /temples/:id', error);
        res.status(500).json({ error: 'Failed to fetch temple' });
    }
});

export default router;