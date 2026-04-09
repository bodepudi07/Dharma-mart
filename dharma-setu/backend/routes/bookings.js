import express from 'express';
import joi from 'joi';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

const bookingSchema = joi.object({
    type: joi.string().valid('darshan', 'pooja', 'yatra', 'donation').required(),
    itemId: joi.number().integer().required(),
    itemName: joi.string().required(),
    cost: joi.number().min(0).required(),
    details: joi.string().allow('', null),
    tierName: joi.string().allow('', null),
    duration: joi.number().integer().min(1)
});

// Helper to create a unified booking object (similar to client-side createBooking)
const createBookingObject = (type, user, itemId, itemName, cost, details, tierName, duration = 30) => {
    return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        type,
        itemId,
        itemName,
        cost,
        timestamp: new Date().toISOString(),
        details,
        tierName,
        duration,
        status: 'confirmed'
    };
};

// Create a booking
router.post('/', authenticate, validateRequest(bookingSchema), async (req, res, next) => {
    const { type, itemId, itemName, cost, details, tierName, duration } = req.body;
    try {
        const newBooking = createBookingObject(type, req.user, itemId, itemName, cost, details, tierName, duration);
        await db.insert('bookings.json', newBooking);

        // Optional: Log activity
        await db.insert('activity_log.json', {
            id: Date.now(),
            type: 'booking',
            message: `Booked ${itemName} (${type}) for ₹${cost}`,
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });

        return standardResponse(res, 201, { booking: newBooking }, `${type.charAt(0).toUpperCase() + type.slice(1)} booked successfully!`);
    } catch (error) {
        next(error);
    }
});

// GET user bookings
router.get('/user/:userId', authenticate, async (req, res, next) => {
    const userId = parseInt(req.params.userId);

    // Authorization: User can only see their own bookings unless they are an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return errorResponse(res, 403, 'Access denied');
    }

    try {
        const bookings = await db.read('bookings.json');
        const userBookings = bookings.filter(b => b.userId === userId);
        return standardResponse(res, 200, userBookings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
        next(error);
    }
});

// Cancel a booking
router.put('/:bookingId/cancel', authenticate, async (req, res, next) => {
    const bookingId = parseInt(req.params.bookingId);

    try {
        const bookings = await db.read('bookings.json');
        const booking = bookings.find(b => b.id === bookingId);

        if (!booking) {
            return errorResponse(res, 404, 'Booking not found');
        }

        // Authorization: Only the booking owner or an admin can cancel
        if (booking.userId !== req.user.id && req.user.role !== 'admin') {
            return errorResponse(res, 403, 'Access denied');
        }

        if (booking.status === 'cancelled') {
            return errorResponse(res, 400, 'Booking is already cancelled');
        }

        const updated = await db.update('bookings.json', bookingId, {
            status: 'cancelled',
            cancelledAt: new Date().toISOString(),
            cancelReason: req.body.reason || 'User requested cancellation'
        });

        await db.insert('activity_log.json', {
            id: Date.now(),
            type: 'cancellation',
            message: `Cancelled ${booking.itemName} (${booking.type}) booking`,
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });

        return standardResponse(res, 200, { booking: updated }, 'Booking cancelled successfully');
    } catch (error) {
        next(error);
    }
});

const rescheduleSchema = joi.object({
    bookingDate: joi.string().isoDate().required(),
    timeSlot: joi.string().allow('', null)
});

// Reschedule a booking
router.put('/:bookingId/reschedule', authenticate, validateRequest(rescheduleSchema), async (req, res, next) => {
    const bookingId = parseInt(req.params.bookingId);
    const { bookingDate, timeSlot } = req.body;

    try {
        const bookings = await db.read('bookings.json');
        const booking = bookings.find(b => b.id === bookingId);

        if (!booking) {
            return errorResponse(res, 404, 'Booking not found');
        }

        if (booking.userId !== req.user.id && req.user.role !== 'admin') {
            return errorResponse(res, 403, 'Access denied');
        }

        if (booking.status === 'cancelled') {
            return errorResponse(res, 400, 'Cannot reschedule a cancelled booking');
        }

        const updates = {
            bookingDate,
            timeSlot: timeSlot || booking.timeSlot,
            rescheduledAt: new Date().toISOString(),
            status: 'confirmed'
        };

        const updated = await db.update('bookings.json', bookingId, updates);

        await db.insert('activity_log.json', {
            id: Date.now(),
            type: 'reschedule',
            message: `Rescheduled ${booking.itemName} (${booking.type}) to ${bookingDate}`,
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });

        return standardResponse(res, 200, { booking: updated }, 'Booking rescheduled successfully');
    } catch (error) {
        next(error);
    }
});

export default router;
