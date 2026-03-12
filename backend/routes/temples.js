import express from 'express';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// GET all temples (with optional pagination)
router.get('/', async (req, res, next) => {
    try {
        const { limit, offset } = req.query;
        const query = {};

        if (limit) query.limit = parseInt(limit);
        if (offset) query.offset = parseInt(offset);

        const temples = await db.find('temples.json', query);
        return standardResponse(res, 200, temples);
    } catch (error) {
        next(error);
    }
});

// GET temple by ID
router.get('/:id', async (req, res, next) => {
    try {
        const templeId = parseInt(req.params.id);
        if (isNaN(templeId)) {
            return errorResponse(res, 400, 'Invalid temple ID');
        }
        const temple = await db.findOne('temples.json', t => t.id === templeId);

        if (!temple) {
            return errorResponse(res, 404, 'Temple not found');
        }

        return standardResponse(res, 200, temple);
    } catch (error) {
        next(error);
    }
});

export default router;