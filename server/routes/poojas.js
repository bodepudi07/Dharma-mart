import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all poojas
router.get('/', async (req, res) => {
    try {
        const { limit, offset } = req.query;
        const query = {};

        if (limit) query.limit = parseInt(limit);
        if (offset) query.offset = parseInt(offset);

        const poojas = await db.find('poojas.json', query);
        res.json(poojas);
    } catch (error) {
        console.error('API Error: /poojas', error);
        res.status(500).json({ error: 'Failed to fetch poojas' });
    }
});

// GET pooja by ID
router.get('/:id', async (req, res) => {
    try {
        const poojaId = parseInt(req.params.id);
        const pooja = await db.findOne('poojas.json', p => p.id === poojaId);

        if (!pooja) {
            return res.status(404).json({ error: 'Pooja not found' });
        }

        res.json(pooja);
    } catch (error) {
        console.error('API Error: /poojas/:id', error);
        res.status(500).json({ error: 'Failed to fetch pooja' });
    }
});

export default router;