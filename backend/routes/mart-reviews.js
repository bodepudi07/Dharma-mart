import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return errorResponse(res, 401, 'Access token required');
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return errorResponse(res, 401, 'Invalid or expired token');
    }
};

// GET /api/mart/reviews/product/:productId — Get reviews for a product
router.get('/product/:productId', async (req, res, next) => {
    try {
        const allReviews = await db.read('mart_reviews.json');
        const reviews = allReviews
            .filter(r => String(r.productId) === req.params.productId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const totalRatings = reviews.length;
        const avgRating = totalRatings > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalRatings).toFixed(1) 
            : 0;
        
        const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => { ratingBreakdown[r.rating] = (ratingBreakdown[r.rating] || 0) + 1; });
        
        return standardResponse(res, 200, { 
            reviews, 
            stats: { totalRatings, avgRating: Number(avgRating), ratingBreakdown }
        }, 'Reviews fetched');
    } catch (error) {
        next(error);
    }
});

// POST /api/mart/reviews — Submit review
router.post('/', authenticateUser, async (req, res, next) => {
    try {
        const { productId, rating, title, comment } = req.body;
        
        if (!productId || !rating) return errorResponse(res, 400, 'Product ID and rating are required');
        if (rating < 1 || rating > 5) return errorResponse(res, 400, 'Rating must be between 1 and 5');
        
        // Check product exists
        const product = await db.findOne('mart_products.json', p => String(p.id) === String(productId));
        if (!product) return errorResponse(res, 404, 'Product not found');
        
        // Check if user already reviewed
        const existing = await db.findOne('mart_reviews.json', r => 
            r.productId === Number(productId) && r.userId === req.user.id
        );
        if (existing) return errorResponse(res, 409, 'You have already reviewed this product');
        
        // Get user info
        const user = await db.findOne('users.json', u => u.id === req.user.id);
        
        const newReview = {
            productId: Number(productId),
            userId: req.user.id,
            userName: user?.name || 'Anonymous',
            rating: Number(rating),
            title: title || '',
            comment: comment || '',
            verified: true,
            helpful: 0,
            createdAt: new Date().toISOString()
        };
        
        const inserted = await db.insert('mart_reviews.json', newReview);
        
        // Update product rating
        const allReviews = await db.read('mart_reviews.json');
        const productReviews = allReviews.filter(r => r.productId === Number(productId));
        const avgRating = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
        await db.update('mart_products.json', Number(productId), { 
            rating: Number(avgRating.toFixed(1)), 
            reviewCount: productReviews.length 
        });
        
        return standardResponse(res, 201, { review: inserted }, 'Review submitted');
    } catch (error) {
        next(error);
    }
});

// DELETE /api/mart/reviews/:id — Delete review
router.delete('/:id', authenticateUser, async (req, res, next) => {
    try {
        const review = await db.findOne('mart_reviews.json', r => String(r.id) === req.params.id);
        if (!review) return errorResponse(res, 404, 'Review not found');
        if (review.userId !== req.user.id && req.user.role !== 'admin') {
            return errorResponse(res, 403, 'Not authorized');
        }
        
        await db.delete('mart_reviews.json', review.id);
        return standardResponse(res, 200, null, 'Review deleted');
    } catch (error) {
        next(error);
    }
});

export default router;
