import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all yatras
router.get('/', async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const query = {};

        if (limit) query.limit = parseInt(limit);
        if (offset) query.offset = parseInt(offset);

        const yatras = await db.find('yatras.json', query);
        res.json(yatras);
    } catch (error) {
        console.error('API Error: /yatras', error);
        res.status(500).json({ error: 'Failed to fetch yatras' });
    }
});

// GET yatra by ID
router.get('/:id', async (req, res) => {
    try {
        const yatraId = parseInt(req.params.id);
        const yatra = await db.findOne('yatras.json', y => y.id === yatraId);

        if (!yatra) {
            return res.status(404).json({ error: 'Yatra not found' });
        }

        res.json(yatra);
    } catch (error) {
        console.error('API Error: /yatras/:id', error);
        res.status(500).json({ error: 'Failed to fetch yatra' });
    }
});

export default router;