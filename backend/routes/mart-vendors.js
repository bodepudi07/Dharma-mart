import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/mart/vendors/register — Vendor registration
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, name, storeName, phone, address } = req.body;
        
        if (!email || !password || !name || !storeName) {
            return errorResponse(res, 400, 'Email, password, name, and store name are required');
        }
        
        const existing = await db.findOne('mart_vendors.json', v => v.email === email);
        if (existing) return errorResponse(res, 409, 'Vendor with this email already exists');
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newVendor = {
            email,
            password: hashedPassword,
            name,
            storeName,
            storeDescription: '',
            storeLogo: '',
            phone: phone || '',
            address: address || '',
            gstin: '',
            role: 'vendor',
            status: 'pending',
            verified: false,
            rating: 0,
            totalSales: 0,
            totalRevenue: 0,
            totalProducts: 0,
            joinedAt: new Date().toISOString(),
            lastLoginAt: null,
            bankDetails: { accountName: '', accountNumber: '', ifscCode: '', bankName: '' },
            policies: {
                returnPolicy: '7-day returns',
                shippingPolicy: 'Standard shipping in 5-7 business days',
                cancellationPolicy: 'Cancellation within 24 hours'
            }
        };
        
        const inserted = await db.insert('mart_vendors.json', newVendor);
        const { password: _, ...vendorWithoutPassword } = inserted;
        return standardResponse(res, 201, { vendor: vendorWithoutPassword }, 'Vendor registered successfully. Pending approval.');
    } catch (error) {
        next(error);
    }
});

// POST /api/mart/vendors/login — Vendor login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return errorResponse(res, 400, 'Email and password are required');
        }
        
        const vendor = await db.findOne('mart_vendors.json', v => v.email === email);
        if (!vendor) return errorResponse(res, 401, 'Invalid credentials');
        
        const isValid = await bcrypt.compare(password, vendor.password);
        if (!isValid) return errorResponse(res, 401, 'Invalid credentials');
        
        if (vendor.status === 'suspended') {
            return errorResponse(res, 403, 'Your vendor account has been suspended');
        }
        
        // Update last login
        await db.update('mart_vendors.json', vendor.id, { lastLoginAt: new Date().toISOString() });
        
        const token = jwt.sign(
            { id: vendor.id, email: vendor.email, role: vendor.role, type: 'vendor' },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        const { password: _, ...vendorWithoutPassword } = vendor;
        return standardResponse(res, 200, { vendor: vendorWithoutPassword, token }, 'Login successful');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/vendors/verify — Verify vendor token
router.get('/verify', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return errorResponse(res, 401, 'Access token required');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'vendor') return errorResponse(res, 403, 'Not a vendor token');
        
        const vendor = await db.findOne('mart_vendors.json', v => v.id === decoded.id);
        if (!vendor) return errorResponse(res, 404, 'Vendor not found');
        
        const { password: _, ...vendorWithoutPassword } = vendor;
        return standardResponse(res, 200, { vendor: vendorWithoutPassword, token }, 'Token verified');
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return errorResponse(res, 401, 'Invalid or expired token');
        }
        next(error);
    }
});

// Middleware to authenticate vendor from JWT
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

// GET /api/mart/vendors/profile — Get vendor profile
router.get('/profile', authenticateVendor, async (req, res, next) => {
    try {
        const vendor = await db.findOne('mart_vendors.json', v => v.id === req.vendor.id);
        if (!vendor) return errorResponse(res, 404, 'Vendor not found');
        
        const { password: _, ...vendorWithoutPassword } = vendor;
        return standardResponse(res, 200, { vendor: vendorWithoutPassword }, 'Profile fetched');
    } catch (error) {
        next(error);
    }
});

// PUT /api/mart/vendors/profile — Update vendor profile
router.put('/profile', authenticateVendor, async (req, res, next) => {
    try {
        const allowedFields = ['name', 'storeName', 'storeDescription', 'storeLogo', 'phone', 'address', 'gstin', 'bankDetails', 'policies'];
        const updates = {};
        
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }
        
        const updated = await db.update('mart_vendors.json', req.vendor.id, updates);
        if (!updated) return errorResponse(res, 404, 'Vendor not found');
        
        const { password: _, ...vendorWithoutPassword } = updated;
        return standardResponse(res, 200, { vendor: vendorWithoutPassword }, 'Profile updated');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/vendors/dashboard — Dashboard analytics
router.get('/dashboard', authenticateVendor, async (req, res, next) => {
    try {
        const vendor = await db.findOne('mart_vendors.json', v => v.id === req.vendor.id);
        if (!vendor) return errorResponse(res, 404, 'Vendor not found');
        
        const allProducts = await db.read('mart_products.json');
        const vendorProducts = allProducts.filter(p => p.vendorId === req.vendor.id);
        
        const allOrders = await db.read('mart_orders.json');
        const vendorOrders = allOrders.filter(o => 
            o.items && o.items.some(item => item.vendorId === req.vendor.id)
        );
        
        const totalRevenue = vendorOrders
            .filter(o => o.status !== 'cancelled')
            .reduce((sum, o) => {
                const vendorItems = o.items.filter(item => item.vendorId === req.vendor.id);
                return sum + vendorItems.reduce((s, item) => s + (item.price * item.quantity), 0);
            }, 0);
        
        const pendingOrders = vendorOrders.filter(o => o.status === 'pending').length;
        const processingOrders = vendorOrders.filter(o => o.status === 'processing').length;
        const completedOrders = vendorOrders.filter(o => o.status === 'delivered').length;
        
        // Top selling products
        const productSales = {};
        vendorOrders.forEach(order => {
            order.items.filter(item => item.vendorId === req.vendor.id).forEach(item => {
                productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
            });
        });
        
        const topProducts = Object.entries(productSales)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([productId, sales]) => {
                const product = vendorProducts.find(p => String(p.id) === productId);
                return { product: product?.name || 'Unknown', sales };
            });
        
        // Recent orders (last 10)
        const recentOrders = vendorOrders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10)
            .map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customerName: o.customerName,
                total: o.total,
                status: o.status,
                createdAt: o.createdAt
            }));
        
        // Monthly revenue (last 6 months)
        const monthlyRevenue = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const year = date.getFullYear();
            const month = date.getMonth();
            
            const monthOrders = vendorOrders.filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate.getFullYear() === year && 
                       orderDate.getMonth() === month && 
                       o.status !== 'cancelled';
            });
            
            const revenue = monthOrders.reduce((sum, o) => {
                const vendorItems = o.items.filter(item => item.vendorId === req.vendor.id);
                return sum + vendorItems.reduce((s, item) => s + (item.price * item.quantity), 0);
            }, 0);
            
            monthlyRevenue.push({
                month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
                revenue,
                orders: monthOrders.length
            });
        }
        
        const dashboard = {
            totalProducts: vendorProducts.length,
            activeProducts: vendorProducts.filter(p => p.status === 'active').length,
            totalOrders: vendorOrders.length,
            pendingOrders,
            processingOrders,
            completedOrders,
            totalRevenue,
            averageRating: vendor.rating,
            topProducts,
            recentOrders,
            monthlyRevenue,
            lowStockProducts: vendorProducts.filter(p => p.stock <= 10 && p.stock > 0).length,
            outOfStockProducts: vendorProducts.filter(p => p.stock === 0).length
        };
        
        return standardResponse(res, 200, { dashboard }, 'Dashboard data fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/vendors/:id/public — Public vendor storefront
router.get('/:id/public', async (req, res, next) => {
    try {
        const vendor = await db.findOne('mart_vendors.json', v => String(v.id) === req.params.id);
        if (!vendor) return errorResponse(res, 404, 'Vendor not found');
        
        const publicInfo = {
            id: vendor.id,
            name: vendor.name,
            storeName: vendor.storeName,
            storeDescription: vendor.storeDescription,
            storeLogo: vendor.storeLogo,
            rating: vendor.rating,
            verified: vendor.verified,
            totalProducts: vendor.totalProducts,
            joinedAt: vendor.joinedAt,
            policies: vendor.policies
        };
        
        return standardResponse(res, 200, { vendor: publicInfo }, 'Vendor info fetched');
    } catch (error) {
        next(error);
    }
});

export { authenticateVendor };
export default router;
