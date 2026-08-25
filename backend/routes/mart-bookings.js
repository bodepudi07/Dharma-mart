import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// Auth middlewares
const authenticateCustomer = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return errorResponse(res, 401, 'Access token required');
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return errorResponse(res, 401, 'Invalid or expired token');
    }
};

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

// Generate booking number
const generateBookingNumber = () => {
    const prefix = 'PJ';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

// POST /api/mart/bookings — One-click composite booking
router.post('/', authenticateCustomer, async (req, res, next) => {
    try {
        const {
            pujaId, tier, tradition, date, timeSlot,
            location, panditId, panditPreference,
            customerName, customerPhone, customerAddress,
            addOns, notes
        } = req.body;
        
        // Validate required fields
        if (!pujaId || !tier || !date || !customerName || !customerPhone) {
            return errorResponse(res, 400, 'Puja, tier, date, name, and phone are required');
        }
        
        const validTiers = ['essential', 'complete', 'sampoorna'];
        if (!validTiers.includes(tier)) {
            return errorResponse(res, 400, 'Invalid tier. Choose essential, complete, or sampoorna');
        }
        
        // Get puja details
        const puja = await db.findOne('mart_pujas.json', p => p.id === Number(pujaId));
        if (!puja) return errorResponse(res, 404, 'Puja not found');
        
        const tierData = puja.tiers[tier];
        if (!tierData) return errorResponse(res, 400, 'Tier not available for this puja');
        
        // Build composite price breakdown
        const breakdown = [];
        
        // Base puja kit price
        const kitPrice = tier === 'essential' ? Math.round(tierData.price * 0.5) :
                         tier === 'complete' ? Math.round(tierData.price * 0.25) :
                         Math.round(tierData.price * 0.2);
        breakdown.push({ item: '📦 Puja Kit & Samagri', price: kitPrice });
        
        // Fresh materials
        if (tier !== 'essential') {
            const freshPrice = tier === 'complete' ? 199 : 399;
            breakdown.push({ item: '🌸 Fresh Flowers & Materials', price: freshPrice });
        }
        
        // Fruits & Naivedyam
        if (tier !== 'essential') {
            const naivedyamPrice = tier === 'complete' ? 199 : 499;
            breakdown.push({ item: '🍌 Fruits & Naivedyam', price: naivedyamPrice });
        }
        
        // Pandit
        let assignedPandit = null;
        if (tier !== 'essential' || panditId) {
            let panditCost = 0;
            if (panditId) {
                const pandit = await db.findOne('mart_pandits.json', p => p.id === Number(panditId));
                if (pandit) {
                    assignedPandit = {
                        id: pandit.id, name: pandit.name, photo: pandit.photo,
                        tradition: pandit.tradition, rating: pandit.rating
                    };
                    panditCost = pandit.hourlyRate * (tier === 'sampoorna' ? 3 : 2);
                }
            } else {
                panditCost = tier === 'complete' ? 1000 : 2000;
            }
            breakdown.push({ 
                item: tier === 'sampoorna' ? '🧑‍🦳 Senior Vedic Pandit' : '🧑‍🦳 Verified Pandit', 
                price: panditCost 
            });
        } else {
            breakdown.push({ item: '💻 Online Pandit Guidance', price: 0 });
        }
        
        // Puja Vidhi / Vrat Katha
        const vidhiPrice = tier === 'essential' ? 0 : tier === 'complete' ? 49 : 99;
        breakdown.push({ item: '📖 Puja Vidhi / Vrat Katha', price: vidhiPrice });
        
        // Service & delivery
        const servicePrice = tier === 'essential' ? 49 : tier === 'complete' ? 99 : 0;
        breakdown.push({ item: '🚚 Delivery & Service', price: servicePrice });
        
        // Add-ons
        const processedAddOns = [];
        if (addOns && Array.isArray(addOns)) {
            for (const addon of addOns) {
                if (addon === 'photography') {
                    processedAddOns.push({ name: '📸 Puja Photography', price: 999 });
                    breakdown.push({ item: '📸 Puja Photography (Add-on)', price: 999 });
                }
                if (addon === 'decoration') {
                    processedAddOns.push({ name: '🌺 Extra Flower Decoration', price: 599 });
                    breakdown.push({ item: '🌺 Extra Flower Decoration (Add-on)', price: 599 });
                }
                if (addon === 'prasadam-boxes') {
                    processedAddOns.push({ name: '🍱 Prasadam Distribution Boxes (10)', price: 499 });
                    breakdown.push({ item: '🍱 Prasadam Boxes (Add-on)', price: 499 });
                }
            }
        }
        
        const subtotal = breakdown.reduce((sum, b) => sum + b.price, 0);
        const platformFee = Math.round(subtotal * 0.02); // 2% platform fee
        const total = subtotal + platformFee;
        
        const newBooking = {
            bookingNumber: generateBookingNumber(),
            userId: req.user.id,
            customerName,
            customerEmail: req.user.email,
            customerPhone,
            customerAddress: customerAddress || {},
            
            pujaId: puja.id,
            pujaName: puja.name,
            pujaDeity: puja.deity,
            tier,
            tierName: tierData.name,
            tradition: tradition || 'north-indian',
            
            date,
            timeSlot: timeSlot || 'morning',
            location: location || '',
            
            panditId: assignedPandit?.id || null,
            pandit: assignedPandit,
            panditPreference: panditPreference || 'any',
            
            breakdown,
            addOns: processedAddOns,
            subtotal,
            platformFee,
            total,
            
            status: 'booked',
            statusHistory: [
                { status: 'booked', timestamp: new Date().toISOString(), note: 'Puja booking confirmed' }
            ],
            
            notes: notes || '',
            review: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const inserted = await db.insert('mart_bookings.json', newBooking);
        
        // Update puja booking count
        await db.update('mart_pujas.json', puja.id, { bookingCount: (puja.bookingCount || 0) + 1 });
        
        return standardResponse(res, 201, { booking: inserted }, 'Puja booked successfully! 🙏');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/bookings — Customer booking history
router.get('/', authenticateCustomer, async (req, res, next) => {
    try {
        const allBookings = await db.read('mart_bookings.json');
        let bookings = allBookings.filter(b => b.userId === req.user.id);
        
        const { status, page = 1, limit = 10 } = req.query;
        if (status) bookings = bookings.filter(b => b.status === status);
        
        bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const total = bookings.length;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        bookings = bookings.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        
        return standardResponse(res, 200, {
            bookings,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        }, 'Bookings fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/bookings/vendor — Admin/vendor view all bookings
router.get('/vendor', authenticateVendor, async (req, res, next) => {
    try {
        let bookings = await db.read('mart_bookings.json');
        
        const { status, search, date, page = 1, limit = 20 } = req.query;
        
        if (status) bookings = bookings.filter(b => b.status === status);
        if (date) bookings = bookings.filter(b => b.date && b.date.startsWith(date));
        if (search) {
            const q = search.toLowerCase();
            bookings = bookings.filter(b =>
                b.bookingNumber?.toLowerCase().includes(q) ||
                b.customerName?.toLowerCase().includes(q) ||
                b.pujaName?.toLowerCase().includes(q)
            );
        }
        
        bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const total = bookings.length;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        bookings = bookings.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        
        return standardResponse(res, 200, {
            bookings,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        }, 'Vendor bookings fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/bookings/:id — Booking detail
router.get('/:id', authenticateCustomer, async (req, res, next) => {
    try {
        const booking = await db.findOne('mart_bookings.json', b => String(b.id) === req.params.id);
        if (!booking) return errorResponse(res, 404, 'Booking not found');
        if (booking.userId !== req.user.id) return errorResponse(res, 403, 'Not authorized');
        
        // Get kit breakdown for this puja
        const allKits = await db.read('mart_kits.json');
        const kit = allKits.find(k => k.pujaId === booking.pujaId) || null;
        
        return standardResponse(res, 200, { booking, kit }, 'Booking detail fetched');
    } catch (error) {
        next(error);
    }
});

// PUT /api/mart/bookings/:id/status — Admin updates booking status
router.put('/:id/status', authenticateVendor, async (req, res, next) => {
    try {
        const { status, note, panditId } = req.body;
        const validStatuses = ['booked', 'confirmed', 'kit-prepared', 'dispatched', 'pandit-assigned', 'in-progress', 'completed', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return errorResponse(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        
        const booking = await db.findOne('mart_bookings.json', b => String(b.id) === req.params.id);
        if (!booking) return errorResponse(res, 404, 'Booking not found');
        
        const updates = {
            status,
            updatedAt: new Date().toISOString()
        };
        
        // Add to status history
        const statusHistory = booking.statusHistory || [];
        statusHistory.push({
            status,
            timestamp: new Date().toISOString(),
            note: note || `Status updated to ${status}`
        });
        updates.statusHistory = statusHistory;
        
        // Assign pandit if provided
        if (panditId) {
            const pandit = await db.findOne('mart_pandits.json', p => p.id === Number(panditId));
            if (pandit) {
                updates.panditId = pandit.id;
                updates.pandit = {
                    id: pandit.id, name: pandit.name, photo: pandit.photo,
                    tradition: pandit.tradition, rating: pandit.rating, phone: pandit.phone
                };
            }
        }
        
        const updated = await db.update('mart_bookings.json', booking.id, updates);
        return standardResponse(res, 200, { booking: updated }, 'Booking status updated');
    } catch (error) {
        next(error);
    }
});

export default router;
