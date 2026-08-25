import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// Vendor auth middleware
const authenticateVendor = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return errorResponse(res, 401, 'Access token required');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'vendor') return errorResponse(res, 403, 'Not a vendor token');
        req.vendor = decoded;
        next();
    } catch (error) {
        return errorResponse(res, 401, 'Invalid or expired token');
    }
};

// GET /api/mart/pandits — Public pandit listing
router.get('/', async (req, res, next) => {
    try {
        let pandits = await db.read('mart_pandits.json');
        pandits = pandits.filter(p => p.status === 'active');
        
        const { search, tradition, language, location, pujaId, senior } = req.query;
        
        if (search) {
            const q = search.toLowerCase();
            pandits = pandits.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.specializations.some(s => s.toLowerCase().includes(q)) ||
                p.location.toLowerCase().includes(q)
            );
        }
        if (tradition) pandits = pandits.filter(p => p.tradition === tradition);
        if (language) pandits = pandits.filter(p => p.languages.some(l => l.toLowerCase() === language.toLowerCase()));
        if (location) pandits = pandits.filter(p => p.serviceArea.some(a => a.toLowerCase().includes(location.toLowerCase())));
        if (pujaId) pandits = pandits.filter(p => p.pujaIds && p.pujaIds.includes(Number(pujaId)));
        if (senior === 'true') pandits = pandits.filter(p => p.senior);
        
        // Sort by rating then experience
        pandits.sort((a, b) => b.rating - a.rating || b.experience - a.experience);
        
        // Public-safe projection
        const publicPandits = pandits.map(p => ({
            id: p.id, name: p.name, photo: p.photo, title: p.title, bio: p.bio,
            languages: p.languages, experience: p.experience, location: p.location,
            serviceArea: p.serviceArea, specializations: p.specializations,
            sampradaya: p.sampradaya, tradition: p.tradition,
            hourlyRate: p.hourlyRate, rating: p.rating, reviewCount: p.reviewCount,
            completedPujas: p.completedPujas, verified: p.verified, senior: p.senior,
            availability: p.availability
        }));
        
        return standardResponse(res, 200, { pandits: publicPandits }, 'Pandits fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/pandits/available — Check pandit availability for date + puja + location
router.get('/available', async (req, res, next) => {
    try {
        const { date, pujaId, location, tradition } = req.query;
        let pandits = await db.read('mart_pandits.json');
        pandits = pandits.filter(p => p.status === 'active');
        
        if (pujaId) pandits = pandits.filter(p => p.pujaIds && p.pujaIds.includes(Number(pujaId)));
        if (location) pandits = pandits.filter(p => p.serviceArea.some(a => a.toLowerCase().includes(location.toLowerCase())));
        if (tradition) pandits = pandits.filter(p => p.tradition === tradition);
        
        // Check day availability
        if (date) {
            const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            pandits = pandits.filter(p => p.availability && p.availability[dayOfWeek] !== false);
            
            // Check if pandit already has a booking on that date
            const bookings = await db.read('mart_bookings.json');
            const dateStr = new Date(date).toISOString().split('T')[0];
            pandits = pandits.filter(p => {
                const panditBookings = bookings.filter(b => 
                    b.panditId === p.id && 
                    b.date && b.date.startsWith(dateStr) &&
                    b.status !== 'cancelled'
                );
                return panditBookings.length < 2; // Allow max 2 bookings per day
            });
        }
        
        const available = pandits.map(p => ({
            id: p.id, name: p.name, photo: p.photo, title: p.title,
            languages: p.languages, experience: p.experience, location: p.location,
            tradition: p.tradition, sampradaya: p.sampradaya,
            hourlyRate: p.hourlyRate, rating: p.rating, reviewCount: p.reviewCount,
            verified: p.verified, senior: p.senior
        }));
        
        return standardResponse(res, 200, { pandits: available, count: available.length }, 'Available pandits fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/pandits/:id — Pandit detail profile
router.get('/:id', async (req, res, next) => {
    try {
        const pandit = await db.findOne('mart_pandits.json', p => String(p.id) === req.params.id);
        if (!pandit || pandit.status !== 'active') return errorResponse(res, 404, 'Pandit not found');
        
        // Get pujas this pandit performs
        const allPujas = await db.read('mart_pujas.json');
        const pujas = allPujas.filter(p => pandit.pujaIds && pandit.pujaIds.includes(p.id))
            .map(p => ({ id: p.id, name: p.name, slug: p.slug, deity: p.deity }));
        
        // Get reviews
        const allReviews = await db.read('mart_reviews.json');
        const reviews = allReviews.filter(r => r.panditId === pandit.id).slice(0, 10);
        
        const { password, ...publicPandit } = pandit;
        
        return standardResponse(res, 200, { pandit: publicPandit, pujas, reviews }, 'Pandit detail fetched');
    } catch (error) {
        next(error);
    }
});

// POST /api/mart/pandits — Admin creates pandit
router.post('/', authenticateVendor, async (req, res, next) => {
    try {
        if (req.vendor.role !== 'super_admin') {
            return errorResponse(res, 403, 'Only super admin can add pandits');
        }
        
        const { name, photo, title, bio, languages, experience, location, serviceArea,
            specializations, sampradaya, tradition, pujaIds, hourlyRate } = req.body;
        
        if (!name || !location) return errorResponse(res, 400, 'Name and location are required');
        
        const newPandit = {
            name, photo: photo || '', title: title || 'Vedic Pandit',
            bio: bio || '', languages: languages || [], experience: experience || 0,
            location, serviceArea: serviceArea || [location],
            specializations: specializations || [], sampradaya: sampradaya || '',
            tradition: tradition || '', pujaIds: pujaIds || [],
            hourlyRate: hourlyRate || 1000, rating: 0, reviewCount: 0,
            completedPujas: 0, verified: false, senior: false,
            availability: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: true },
            status: 'active', joinedAt: new Date().toISOString()
        };
        
        const inserted = await db.insert('mart_pandits.json', newPandit);
        return standardResponse(res, 201, { pandit: inserted }, 'Pandit created');
    } catch (error) {
        next(error);
    }
});

// PUT /api/mart/pandits/:id — Admin updates pandit
router.put('/:id', authenticateVendor, async (req, res, next) => {
    try {
        if (req.vendor.role !== 'super_admin') {
            return errorResponse(res, 403, 'Only super admin can update pandits');
        }
        
        const pandit = await db.findOne('mart_pandits.json', p => String(p.id) === req.params.id);
        if (!pandit) return errorResponse(res, 404, 'Pandit not found');
        
        const updated = await db.update('mart_pandits.json', pandit.id, req.body);
        return standardResponse(res, 200, { pandit: updated }, 'Pandit updated');
    } catch (error) {
        next(error);
    }
});

export default router;
