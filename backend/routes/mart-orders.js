import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';

const router = express.Router();

// Auth middleware for customers
const authenticateCustomer = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return errorResponse(res, 401, 'Access token required');
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return errorResponse(res, 401, 'Invalid or expired token');
    }
};

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

// Generate order number
const generateOrderNumber = () => {
    const prefix = 'DM';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
};

// POST /api/mart/orders — Customer places order
router.post('/', authenticateCustomer, async (req, res, next) => {
    try {
        const { items, shippingAddress, paymentMethod, notes } = req.body;
        
        if (!items || items.length === 0) {
            return errorResponse(res, 400, 'Order must have at least one item');
        }
        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city || !shippingAddress.pincode) {
            return errorResponse(res, 400, 'Complete shipping address is required');
        }
        
        // Validate products and calculate totals
        const allProducts = await db.read('mart_products.json');
        let subtotal = 0;
        const validatedItems = [];
        
        for (const item of items) {
            const product = allProducts.find(p => String(p.id) === String(item.productId));
            if (!product) return errorResponse(res, 400, `Product ${item.productId} not found`);
            if (product.stock < item.quantity) {
                return errorResponse(res, 400, `Insufficient stock for ${product.name}. Available: ${product.stock}`);
            }
            
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;
            
            validatedItems.push({
                productId: product.id,
                vendorId: product.vendorId,
                name: product.name,
                thumbnail: product.thumbnail,
                price: product.price,
                quantity: item.quantity,
                total: itemTotal
            });
            
            // Reduce stock
            await db.update('mart_products.json', product.id, { 
                stock: product.stock - item.quantity,
                soldCount: (product.soldCount || 0) + item.quantity
            });
        }
        
        const shipping = subtotal >= 499 ? 0 : 49;
        const tax = Math.round(subtotal * 0.05); // 5% GST simplified
        const total = subtotal + shipping + tax;
        
        const newOrder = {
            orderNumber: generateOrderNumber(),
            userId: req.user.id,
            customerName: shippingAddress.fullName,
            customerEmail: req.user.email,
            items: validatedItems,
            shippingAddress,
            paymentMethod: paymentMethod || 'cod',
            subtotal,
            shipping,
            tax,
            total,
            status: 'pending',
            notes: notes || '',
            statusHistory: [
                { status: 'pending', timestamp: new Date().toISOString(), note: 'Order placed' }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const inserted = await db.insert('mart_orders.json', newOrder);
        return standardResponse(res, 201, { order: inserted }, 'Order placed successfully');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/orders — Customer views their orders
router.get('/', authenticateCustomer, async (req, res, next) => {
    try {
        const allOrders = await db.read('mart_orders.json');
        let orders = allOrders.filter(o => o.userId === req.user.id);
        
        const { status, page = 1, limit = 10 } = req.query;
        if (status) orders = orders.filter(o => o.status === status);
        
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const total = orders.length;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        orders = orders.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        
        return standardResponse(res, 200, {
            orders,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        }, 'Orders fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/orders/vendor — Vendor views orders for their products
router.get('/vendor', authenticateVendor, async (req, res, next) => {
    try {
        const allOrders = await db.read('mart_orders.json');
        let orders;
        
        if (req.vendor.role === 'super_admin') {
            orders = allOrders;
        } else {
            orders = allOrders.filter(o => 
                o.items && o.items.some(item => item.vendorId === req.vendor.id)
            );
        }
        
        const { status, search, page = 1, limit = 20 } = req.query;
        if (status) orders = orders.filter(o => o.status === status);
        if (search) {
            const q = search.toLowerCase();
            orders = orders.filter(o => 
                o.orderNumber?.toLowerCase().includes(q) ||
                o.customerName?.toLowerCase().includes(q) ||
                o.customerEmail?.toLowerCase().includes(q)
            );
        }
        
        orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const total = orders.length;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        orders = orders.slice((pageNum - 1) * limitNum, pageNum * limitNum);
        
        return standardResponse(res, 200, {
            orders,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        }, 'Vendor orders fetched');
    } catch (error) {
        next(error);
    }
});

// GET /api/mart/orders/:id — Order detail
router.get('/:id', authenticateCustomer, async (req, res, next) => {
    try {
        const order = await db.findOne('mart_orders.json', o => String(o.id) === req.params.id);
        if (!order) return errorResponse(res, 404, 'Order not found');
        if (order.userId !== req.user.id) return errorResponse(res, 403, 'Not authorized');
        return standardResponse(res, 200, { order }, 'Order detail fetched');
    } catch (error) {
        next(error);
    }
});

// PUT /api/mart/orders/:id/status — Vendor updates order status
router.put('/:id/status', authenticateVendor, async (req, res, next) => {
    try {
        const { status, note } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        
        if (!validStatuses.includes(status)) {
            return errorResponse(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        
        const order = await db.findOne('mart_orders.json', o => String(o.id) === req.params.id);
        if (!order) return errorResponse(res, 404, 'Order not found');
        
        // Verify vendor owns one of the order items (or is super_admin)
        if (req.vendor.role !== 'super_admin') {
            const hasVendorItems = order.items.some(item => item.vendorId === req.vendor.id);
            if (!hasVendorItems) return errorResponse(res, 403, 'Not authorized to update this order');
        }
        
        const statusHistory = order.statusHistory || [];
        statusHistory.push({
            status,
            timestamp: new Date().toISOString(),
            note: note || `Status updated to ${status}`
        });
        
        const updated = await db.update('mart_orders.json', order.id, { 
            status, 
            statusHistory,
            updatedAt: new Date().toISOString()
        });
        
        return standardResponse(res, 200, { order: updated }, 'Order status updated');
    } catch (error) {
        next(error);
    }
});

export default router;
