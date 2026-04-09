import express from 'express';
import joi from 'joi';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

const sankalpaSchema = joi.object({
    sevaId: joi.number().integer().required(),
    devoteeName: joi.string().trim().min(2).max(100).required(),
    gotra: joi.string().trim().required(),
    rashi: joi.string().trim().allow('', null),
    nakshatra: joi.string().trim().allow('', null),
    address: joi.string().trim().min(5).max(300).required(),
    pincode: joi.string().trim().pattern(/^\d{6}$/).required(),
    phone: joi.string().trim().pattern(/^\d{10}$/).required(),
    date: joi.string().isoDate().required(),
    panditId: joi.number().integer().required()
});

// Create a sankalpa
router.post('/', authenticate, validateRequest(sankalpaSchema), async (req, res, next) => {
    const { sevaId, devoteeName, gotra, rashi, nakshatra, address, pincode, phone, date, panditId } = req.body;

    try {
        const newSankalpa = {
            id: `sk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            sevaId,
            userId: req.user.email,
            userIdNum: req.user.id,
            devoteeName,
            gotra,
            rashi: rashi || null,
            nakshatra: nakshatra || null,
            address,
            pincode,
            phone,
            date,
            panditId,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };

        await db.insert('sankalpas.json', newSankalpa);

        await db.insert('activity_log.json', {
            id: Date.now(),
            type: 'sankalpa',
            message: `Sankalpa booked for seva #${sevaId} by ${devoteeName} (${gotra} gotra)`,
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });

        return standardResponse(res, 201, { sankalpa: newSankalpa }, 'Sankalpa created successfully!');
    } catch (error) {
        next(error);
    }
});

// Get user's sankalpas
router.get('/user', authenticate, async (req, res, next) => {
    try {
        const sankalpas = await db.read('sankalpas.json');
        const userSankalpas = sankalpas.filter(s => s.userId === req.user.email || s.userIdNum === req.user.id);
        return standardResponse(res, 200, userSankalpas.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)));
    } catch (error) {
        next(error);
    }
});

// Get all sankalpas (pandit view — returns all for now)
router.get('/all', authenticate, async (req, res, next) => {
    try {
        const sankalpas = await db.read('sankalpas.json');
        return standardResponse(res, 200, sankalpas);
    } catch (error) {
        next(error);
    }
});

// Update sankalpa status (pandit workflow)
router.put('/:sankalpaId/status', authenticate, async (req, res, next) => {
    const { sankalpaId } = req.params;
    const { status, proofVideoUrl, trackingId, panditNotes } = req.body;

    const validStatuses = ['Pending', 'Accepted', 'InProgress', 'Completed', 'ProofUploaded', 'PrasadShipped', 'Delivered'];
    if (!status || !validStatuses.includes(status)) {
        return errorResponse(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    try {
        const sankalpas = await db.read('sankalpas.json');
        const idx = sankalpas.findIndex(s => s.id === sankalpaId);

        if (idx === -1) {
            return errorResponse(res, 404, 'Sankalpa not found');
        }

        const updates = { status };
        if (proofVideoUrl) updates.proofVideoUrl = proofVideoUrl;
        if (trackingId) updates.trackingId = trackingId;
        if (panditNotes) updates.panditNotes = panditNotes;
        updates.updatedAt = new Date().toISOString();

        sankalpas[idx] = { ...sankalpas[idx], ...updates };
        await db.write('sankalpas.json', sankalpas);

        return standardResponse(res, 200, { sankalpa: sankalpas[idx] }, `Status updated to ${status}`);
    } catch (error) {
        next(error);
    }
});

export default router;
