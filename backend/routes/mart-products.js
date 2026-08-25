import express from 'express';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// Vendor auth middleware (inline to avoid circular imports)
import jwt from 'jsonwebtoken';
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

// GET /api/mart/products — Public product catalog
router.get('/', async (req, res, next) => {
    try {
        let products = await db.read('mart_products.json');
        
        // Only show active products for public
        products = products.filter(p => p.status === 'active');
        
        const { 
            search, category, categoryId, minPrice, maxPrice, 
            sort, order, page = 1, limit = 20,
            featured, bestSeller, satvikVerified, vendor
        } = req.query;
        
        // Search
        if (search) {
            const q = search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(q) || 
                p.description.toLowerCase().includes(q) ||
                p.categoryName.toLowerCase().includes(q) ||
                (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
            );
        }
        
        // Category filter
        if (category) {
            products = products.filter(p => p.categoryName.toLowerCase() === category.toLowerCase());
        }
        if (categoryId) {
            products = products.filter(p => String(p.categoryId) === categoryId);
        }
        
        // Price filter
        if (minPrice) products = products.filter(p => p.price >= Number(minPrice));
        if (maxPrice) products = products.filter(p => p.price <= Number(maxPrice));
        
        // Boolean filters
        if (featured === 'true') products = products.filter(p => p.featured);
        if (bestSeller === 'true') products = products.filter(p => p.bestSeller);
        if (satvikVerified === 'true') products = products.filter(p => p.satvikVerified);
        if (vendor) products = products.filter(p => String(p.vendorId) === vendor);
        
        // Total before pagination
        const total = products.length;
        
        // Sorting
        const sortField = sort || 'createdAt';
        const sortOrder = order === 'asc' ? 1 : -1;
        products.sort((a, b) => {
            if (sortField === 'price') return (a.price - b.price) * sortOrder;
            if (sortField === 'rating') return (a.rating - b.rating) * sortOrder;
            if (sortField === 'soldCount') return (a.soldCount - b.soldCount) * sortOrder;
            if (sortField === 'name') return a.name.localeCompare(b.name) * sortOrder;
            // Default: newest first
            return (new Date(b.createdAt) - new Date(a.createdAt)) * sortOrder;
        });
        
        // Pagination
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedProducts = products.slice(startIndex, startIndex + limitNum);
        
        return standardResponse(res, 200, { 
            products: paginatedProducts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        }, 'Products fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/products/featured — Featured products
router.get('/featured', async (req, res, next) => {
    try {
        const products = await db.read('mart_products.json');
        const featured = products.filter(p => p.featured && p.status === 'active').slice(0, 8);
        return standardResponse(res, 200, { products: featured }, 'Featured products fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/products/best-sellers — Best selling products
router.get('/best-sellers', async (req, res, next) => {
    try {
        const products = await db.read('mart_products.json');
        const bestSellers = products
            .filter(p => p.status === 'active')
            .sort((a, b) => b.soldCount - a.soldCount)
            .slice(0, 8);
        return standardResponse(res, 200, { products: bestSellers }, 'Best sellers fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/products/vendor-all — All vendor products (including inactive, for admin panel)
router.get('/vendor-all', authenticateVendor, async (req, res, next) => {
    try {
        let products = await db.read('mart_products.json');
        
        // Super admin sees all, vendors see only their own
        if (req.vendor.role !== 'super_admin') {
            products = products.filter(p => p.vendorId === req.vendor.id);
        }
        
        const { search, status, categoryId, page = 1, limit = 20 } = req.query;
        
        if (search) {
            const q = search.toLowerCase();
            products = products.filter(p => 
                p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
            );
        }
        if (status) products = products.filter(p => p.status === status);
        if (categoryId) products = products.filter(p => String(p.categoryId) === categoryId);
        
        const total = products.length;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        products = products.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        
        return standardResponse(res, 200, {
            products,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        }, 'Vendor products fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/products/:id — Product detail
router.get('/:id', async (req, res, next) => {
    try {
        const product = await db.findOne('mart_products.json', p => String(p.id) === req.params.id);
        if (!product) return errorResponse(res, 404, 'Product not found');
        
        // Get reviews
        const allReviews = await db.read('mart_reviews.json');
        const reviews = allReviews.filter(r => r.productId === product.id);
        
        // Get vendor info
        const vendor = await db.findOne('mart_vendors.json', v => v.id === product.vendorId);
        const vendorInfo = vendor ? {
            id: vendor.id,
            storeName: vendor.storeName,
            rating: vendor.rating,
            verified: vendor.verified
        } : null;
        
        // Get related products (same category)
        const allProducts = await db.read('mart_products.json');
        const related = allProducts
            .filter(p => p.categoryId === product.categoryId && p.id !== product.id && p.status === 'active')
            .slice(0, 4);
        
        return standardResponse(res, 200, { 
            product, 
            reviews, 
            vendor: vendorInfo, 
            relatedProducts: related 
        }, 'Product detail fetched');
    } catch (error) {
        next(error);
    }
});

// POST /api/mart/products — Vendor creates product
router.post('/', authenticateVendor, async (req, res, next) => {
    try {
        const { 
            name, description, shortDesc, price, originalPrice, 
            categoryId, categoryName, images, thumbnail,
            stock, sku, weight, dimensions, material, tags
        } = req.body;
        
        if (!name || !price || !categoryId) {
            return errorResponse(res, 400, 'Name, price, and category are required');
        }
        
        const newProduct = {
            vendorId: req.vendor.id,
            name,
            slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
            description: description || '',
            shortDesc: shortDesc || '',
            price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : Number(price),
            currency: 'INR',
            categoryId: Number(categoryId),
            categoryName: categoryName || '',
            images: images || [],
            thumbnail: thumbnail || (images && images[0]) || '',
            stock: stock ? Number(stock) : 0,
            sku: sku || `DM-${Date.now()}`,
            weight: weight || '',
            dimensions: dimensions || '',
            material: material || '',
            tags: tags || [],
            featured: false,
            bestSeller: false,
            satvikVerified: false,
            rating: 0,
            reviewCount: 0,
            soldCount: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const inserted = await db.insert('mart_products.json', newProduct);
        
        // Update vendor product count
        const vendor = await db.findOne('mart_vendors.json', v => v.id === req.vendor.id);
        if (vendor) {
            const allProducts = await db.read('mart_products.json');
            const count = allProducts.filter(p => p.vendorId === req.vendor.id).length;
            await db.update('mart_vendors.json', req.vendor.id, { totalProducts: count });
        }
        
        return standardResponse(res, 201, { product: inserted }, 'Product created');
    } catch (error) {
        next(error);
    }
});

// PUT /api/mart/products/:id — Vendor updates product
router.put('/:id', authenticateVendor, async (req, res, next) => {
    try {
        const product = await db.findOne('mart_products.json', p => String(p.id) === req.params.id);
        if (!product) return errorResponse(res, 404, 'Product not found');
        
        // Only owner or super_admin can update
        if (product.vendorId !== req.vendor.id && req.vendor.role !== 'super_admin') {
            return errorResponse(res, 403, 'Not authorized to update this product');
        }
        
        const allowedFields = [
            'name', 'description', 'shortDesc', 'price', 'originalPrice',
            'categoryId', 'categoryName', 'images', 'thumbnail',
            'stock', 'sku', 'weight', 'dimensions', 'material', 'tags',
            'featured', 'bestSeller', 'satvikVerified', 'status'
        ];
        
        const updates = { updatedAt: new Date().toISOString() };
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }
        
        if (updates.name) {
            updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        }
        
        const updated = await db.update('mart_products.json', product.id, updates);
        return standardResponse(res, 200, { product: updated }, 'Product updated');
    } catch (error) {
        next(error);
    }
});

// DELETE /api/mart/products/:id — Vendor deletes product
router.delete('/:id', authenticateVendor, async (req, res, next) => {
    try {
        const product = await db.findOne('mart_products.json', p => String(p.id) === req.params.id);
        if (!product) return errorResponse(res, 404, 'Product not found');
        
        if (product.vendorId !== req.vendor.id && req.vendor.role !== 'super_admin') {
            return errorResponse(res, 403, 'Not authorized to delete this product');
        }
        
        await db.delete('mart_products.json', product.id);
        
        // Update vendor product count
        const allProducts = await db.read('mart_products.json');
        const count = allProducts.filter(p => p.vendorId === req.vendor.id).length;
        await db.update('mart_vendors.json', req.vendor.id, { totalProducts: count });
        
        return standardResponse(res, 200, null, 'Product deleted');
    } catch (error) {
        next(error);
    }
});

export default router;
