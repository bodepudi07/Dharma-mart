import express from 'express';
import db from '../db.js';
import { authenticate } from './middleware/auth.js';

const router = express.Router();

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
router.post('/', authenticate, async (req, res) => {
    const { type, itemId, itemName, cost, details, tierName, duration } = req.body;
    try {
        const bookings = await db.read('bookings.json');
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

        res.json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} booked successfully!`, booking: newBooking });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create booking' });
    }
});

// GET user bookings
router.get('/user/:userId', authenticate, async (req, res) => {
    const userId = parseInt(req.params.userId);

    // Authorization: User can only see their own bookings unless they are an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const bookings = await db.read('bookings.json');
        const userBookings = bookings.filter(b => b.userId === userId);
        res.json(userBookings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

export default router;
