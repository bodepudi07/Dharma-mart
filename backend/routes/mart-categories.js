import express from 'express';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// GET /api/mart/categories — List all categories
router.get('/', async (req, res, next) => {
    try {
        const categories = await db.read('mart_categories.json');
        
        // Compute product counts dynamically
        const products = await db.read('mart_products.json');
        const enriched = categories.map(cat => ({
            ...cat,
            productCount: products.filter(p => p.categoryId === cat.id && p.status === 'active').length
        }));
        
        return standardResponse(res, 200, { categories: enriched }, 'Categories fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/categories/:id — Get single category
router.get('/:id', async (req, res, next) => {
    try {
        const category = await db.findOne('mart_categories.json', c => String(c.id) === req.params.id);
        if (!category) return errorResponse(res, 404, 'Category not found');
        return standardResponse(res, 200, { category }, 'Category fetched');
    } catch (error) {
        next(error);
    }
});

// POST /api/mart/categories — Admin creates category
router.post('/', async (req, res, next) => {
    try {
        const { name, slug, icon, description, image } = req.body;
        if (!name) return errorResponse(res, 400, 'Category name is required');
        
        const existing = await db.findOne('mart_categories.json', c => c.slug === (slug || name.toLowerCase().replace(/\s+/g, '-')));
        if (existing) return errorResponse(res, 409, 'Category already exists');
        
        const newCategory = {
            name,
            slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
            icon: icon || 'tag',
            description: description || '',
            image: image || '',
            productCount: 0,
            featured: false
        };
        
        const inserted = await db.insert('mart_categories.json', newCategory);
        return standardResponse(res, 201, { category: inserted }, 'Category created');
    } catch (error) {
        next(error);
    }
});

export default router;
