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
        const poojas = await db.find('poojas.json', query);
        return standardResponse(res, 200, poojas);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const poojaId = parseInt(req.params.id);
        if (isNaN(poojaId)) return errorResponse(res, 400, 'Invalid pooja ID');
        const pooja = await db.findOne('poojas.json', p => p.id === poojaId);
        if (!pooja) return errorResponse(res, 404, 'Pooja not found');
        return standardResponse(res, 200, pooja);
    } catch (error) {
        next(error);
    }
});

export default router;