import express from 'express';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// GET /api/mart/pujas — Browse Puja catalog
router.get('/', async (req, res, next) => {
    try {
        let pujas = await db.read('mart_pujas.json');
        pujas = pujas.filter(p => p.status === 'active');
        
        const { search, occasion, tradition, featured, sort, page = 1, limit = 20 } = req.query;
        
        if (search) {
            const q = search.toLowerCase();
            pujas = pujas.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.deity.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                (p.occasionTags && p.occasionTags.some(t => t.includes(q)))
            );
        }
        
        if (occasion) {
            pujas = pujas.filter(p => 
                p.occasionType === occasion || 
                (p.occasionTags && p.occasionTags.includes(occasion))
            );
        }
        
        if (tradition) {
            pujas = pujas.filter(p => 
                p.supportedTraditions && p.supportedTraditions.includes(tradition)
            );
        }
        
        if (featured === 'true') pujas = pujas.filter(p => p.featured);
        
        const total = pujas.length;
        
        // Sorting
        if (sort === 'price-low') {
            pujas.sort((a, b) => a.tiers.essential.price - b.tiers.essential.price);
        } else if (sort === 'price-high') {
            pujas.sort((a, b) => b.tiers.essential.price - a.tiers.essential.price);
        } else if (sort === 'popular') {
            pujas.sort((a, b) => b.bookingCount - a.bookingCount);
        } else if (sort === 'rating') {
            pujas.sort((a, b) => b.rating - a.rating);
        }
        
        // Pagination
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const paginated = pujas.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        
        return standardResponse(res, 200, {
            pujas: paginated,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        }, 'Pujas fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/pujas/featured — Featured pujas for homepage
router.get('/featured', async (req, res, next) => {
    try {
        const pujas = await db.read('mart_pujas.json');
        const featured = pujas.filter(p => p.featured && p.status === 'active')
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 6);
        return standardResponse(res, 200, { pujas: featured }, 'Featured pujas fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/pujas/by-occasion — Group pujas by occasion type
router.get('/by-occasion', async (req, res, next) => {
    try {
        const pujas = await db.read('mart_pujas.json');
        const active = pujas.filter(p => p.status === 'active');
        
        const grouped = {
            festival: active.filter(p => p.occasionType === 'festival'),
            vrat: active.filter(p => p.occasionType === 'vrat'),
            'life-event': active.filter(p => p.occasionType === 'life-event'),
            special: active.filter(p => p.occasionType === 'special'),
            purnima: active.filter(p => p.occasionType === 'purnima')
        };
        
        return standardResponse(res, 200, { occasions: grouped }, 'Pujas by occasion fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/pujas/:id — Puja detail with kit breakdown & available pandits
router.get('/:id', async (req, res, next) => {
    try {
        const puja = await db.findOne('mart_pujas.json', p => String(p.id) === req.params.id);
        if (!puja) return errorResponse(res, 404, 'Puja not found');
        
        // Get kit breakdown
        const allKits = await db.read('mart_kits.json');
        const kit = allKits.find(k => k.pujaId === puja.id) || null;
        
        // Get available pandits for this puja
        const allPandits = await db.read('mart_pandits.json');
        const availablePandits = allPandits
            .filter(p => p.status === 'active' && p.pujaIds && p.pujaIds.includes(puja.id))
            .map(p => ({
                id: p.id,
                name: p.name,
                photo: p.photo,
                title: p.title,
                languages: p.languages,
                experience: p.experience,
                location: p.location,
                tradition: p.tradition,
                sampradaya: p.sampradaya,
                rating: p.rating,
                reviewCount: p.reviewCount,
                completedPujas: p.completedPujas,
                verified: p.verified,
                senior: p.senior,
                hourlyRate: p.hourlyRate
            }));
        
        // Get reviews for this puja
        const allReviews = await db.read('mart_reviews.json');
        const reviews = allReviews.filter(r => r.pujaId === puja.id).slice(0, 10);
        
        return standardResponse(res, 200, {
            puja,
            kit,
            pandits: availablePandits,
            reviews
        }, 'Puja detail fetched');
    } catch (error) {
        next(error);
    }
});

export default router;
