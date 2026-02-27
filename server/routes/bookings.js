import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authenticate } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Helper functions
const readDataFile = async (filename) => {
    try {
        const dataPath = path.join(__dirname, '../../data', filename);
        const data = await fs.readFile(dataPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

const writeDataFile = async (filename, data) => {
    const dataPath = path.join(__dirname, '../../data', filename);
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2));
};

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
        const bookings = await readDataFile('bookings.json');
        const newBooking = createBookingObject(type, req.user, itemId, itemName, cost, details, tierName, duration);
        bookings.push(newBooking);
        await writeDataFile('bookings.json', bookings);

        // Optional: Log activity
        const activityLog = await readDataFile('activity_log.json');
        activityLog.push({
            id: Date.now(),
            type: 'booking',
            message: `Booked ${itemName} (${type}) for ₹${cost}`,
            userId: req.user.id,
            userName: req.user.name,
            timestamp: new Date().toISOString()
        });
        await writeDataFile('activity_log.json', activityLog);

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
        const bookings = await readDataFile('bookings.json');
        const userBookings = bookings.filter(b => b.userId === userId);
        res.json(userBookings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

export default router;
