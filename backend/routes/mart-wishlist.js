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

// GET /api/mart/wishlist — Get user's wishlist
router.get('/', authenticateUser, async (req, res, next) => {
    try {
        const allWishlists = await db.read('mart_wishlists.json');
        const userWishlist = allWishlists.filter(w => w.userId === req.user.id);
        
        // Enrich with product data
        const allProducts = await db.read('mart_products.json');
        const enriched = userWishlist.map(w => {
            const product = allProducts.find(p => p.id === w.productId);
            return { ...w, product: product || null };
        }).filter(w => w.product);
        
        return standardResponse(res, 200, { wishlist: enriched }, 'Wishlist fetched');
    } catch (error) {
        next(error);
    }
});

// POST /api/mart/wishlist/:productId — Add to wishlist
router.post('/:productId', authenticateUser, async (req, res, next) => {
    try {
        const productId = Number(req.params.productId);
        const product = await db.findOne('mart_products.json', p => p.id === productId);
        if (!product) return errorResponse(res, 404, 'Product not found');
        
        const existing = await db.findOne('mart_wishlists.json', w => 
            w.userId === req.user.id && w.productId === productId
        );
        if (existing) return errorResponse(res, 409, 'Product already in wishlist');
        
        const newItem = {
            userId: req.user.id,
            productId,
            addedAt: new Date().toISOString()
        };
        
        const inserted = await db.insert('mart_wishlists.json', newItem);
        return standardResponse(res, 201, { item: inserted }, 'Added to wishlist');
    } catch (error) {
        next(error);
    }
});

// DELETE /api/mart/wishlist/:productId — Remove from wishlist
router.delete('/:productId', authenticateUser, async (req, res, next) => {
    try {
        const productId = Number(req.params.productId);
        const allWishlists = await db.read('mart_wishlists.json');
        const item = allWishlists.find(w => w.userId === req.user.id && w.productId === productId);
        
        if (!item) return errorResponse(res, 404, 'Item not in wishlist');
        
        await db.delete('mart_wishlists.json', item.id);
        return standardResponse(res, 200, null, 'Removed from wishlist');
    } catch (error) {
        next(error);
    }
});

export default router;
