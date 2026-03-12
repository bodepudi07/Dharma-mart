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
        const yatras = await db.find('yatras.json', query);
        return standardResponse(res, 200, yatras);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const yatraId = parseInt(req.params.id);
        if (isNaN(yatraId)) return errorResponse(res, 400, 'Invalid yatra ID');
        const yatra = await db.findOne('yatras.json', y => y.id === yatraId);
        if (!yatra) return errorResponse(res, 404, 'Yatra not found');
        return standardResponse(res, 200, yatra);
    } catch (error) {
        next(error);
    }
});

export default router;