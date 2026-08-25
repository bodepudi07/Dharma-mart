// Import required modules
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorResponse } from './middleware/responseHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import routes
import templesRoute from './routes/temples.js';
import poojasRoute from './routes/poojas.js';
import yatrasRoute from './routes/yatras.js';
import aiRoute from './routes/ai.js';
import authRoute from './routes/auth.js';
import booksRoute from './routes/books.js';
import adminRoute from './routes/admin.js';
import bookingsRoute from './routes/bookings.js';
import usersRoute from './routes/users.js';
import chatsRoute from './routes/chats.js';
import growthRoute from './routes/growth.js';
import postsRoute from './routes/posts.js';
import sankalpasRoute from './routes/sankalpas.js';

// Dharma Mart routes
import martPujasRoute from './routes/mart-pujas.js';
import martPanditsRoute from './routes/mart-pandits.js';
import martBookingsRoute from './routes/mart-bookings.js';
import martProductsRoute from './routes/mart-products.js';
import martCategoriesRoute from './routes/mart-categories.js';
import martVendorsRoute from './routes/mart-vendors.js';
import martReviewsRoute from './routes/mart-reviews.js';
import martWishlistRoute from './routes/mart-wishlist.js';
import martOrdersRoute from './routes/mart-orders.js';

// Create express app
const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Validate critical environment variables at startup
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set. Auth will not work.');
    if (isProduction) process.exit(1);
}

// Trust proxy for accurate rate limiting behind reverse proxies (Nginx, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));

// CORS Configuration - restrict in production
const allowedOrigins = isProduction
    ? [process.env.FRONTEND_URL || 'https://dharmasetu.com'].filter(Boolean)
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:4173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:4173'
    ];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server) or localhost origins in dev
        if (!origin || allowedOrigins.includes(origin) || (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-AI-Session-ID', 'X-Session-ID'],
}));

// Body parser with size limits to prevent abuse
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: isProduction ? 200 : 500,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests. Please try again later.' },
});

// Apply the rate limiting middleware to all API requests.
app.use('/api/', limiter);

// Request logging in development
if (!isProduction) {
    app.use((req, _res, next) => {
        if (req.path.startsWith('/api/')) {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
        }
        next();
    });
}

// Serve static files from the frontend public data folder, strictly allowing only public content
app.use('/data', (req, res, next) => {
    // SECURITY PATCH: Use an allow-list instead of a block-list to prevent data leaks.
    const publicFiles = [
        'temples', 'temples.te', 'temples.hi',
        'poojas', 'poojas.te', 'poojas.hi',
        'yatras', 'yatras.te', 'yatras.hi',
        'events', 'events.te', 'events.hi',
        'pandits', 'pandits.te', 'pandits.hi',
        'books', 'books.te', 'books.hi',
        'festivals', 'festivals.te', 'festivals.hi',
        'remote_sevas', 'remote_sevas.te', 'remote_sevas.hi',
        'chat_rooms', 'chat_messages', 'online_users',
        'meditation', 'aarti_data', 'yatra_quotes',
        'posts', 'bookmarks', 'spiritual_growth',
        'user_preferences', 'products'
    ];

    // Extract base name without JSON extension for strict checking
    const fileName = path.basename(req.path);
    const baseName = fileName.replace('.json', '');

    if (!fileName.endsWith('.json') && !fileName.endsWith('.jpg') && !fileName.endsWith('.png')) {
        // Allow images, but if it's something else, check carefully.
    } else if (fileName.endsWith('.json') && !publicFiles.includes(baseName)) {
        console.warn(`Blocked unauthorized access to static data file: ${fileName}`);
        return res.status(403).json({ error: 'Access to this resource is restricted' });
    }

    next();
}, express.static(path.join(__dirname, '../frontend/public/data'), {
    maxAge: isProduction ? '1d' : 0,
    etag: true,
}));

// API Routes
// Health check endpoint for monitoring and load balancers
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'healthy',
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

app.use('/api/temples', templesRoute);
app.use('/api/poojas', poojasRoute);
app.use('/api/yatras', yatrasRoute);
app.use('/api/ai', aiRoute);
app.use('/api/auth', authRoute);
app.use('/api/books', booksRoute);
app.use('/api/admin', adminRoute);
app.use('/api/bookings', bookingsRoute);
app.use('/api/users', usersRoute);
app.use('/api/chats', chatsRoute);
app.use('/api/growth', growthRoute);
app.use('/api/posts', postsRoute);
app.use('/api/sankalpas', sankalpasRoute);

// Dharma Mart API Routes
app.use('/api/mart/pujas', martPujasRoute);
app.use('/api/mart/pandits', martPanditsRoute);
app.use('/api/mart/bookings', martBookingsRoute);
app.use('/api/mart/products', martProductsRoute);
app.use('/api/mart/categories', martCategoriesRoute);
app.use('/api/mart/vendors', martVendorsRoute);
app.use('/api/mart/reviews', martReviewsRoute);
app.use('/api/mart/wishlist', martWishlistRoute);
app.use('/api/mart/orders', martOrdersRoute);

// Serve frontend build (for production)
if (isProduction) {
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath, { maxAge: '7d' }));
    // SPA fallback - serve index.html for all non-API routes
    app.get('{*splat}', (req, res, next) => {
        if (req.path.startsWith('/api/') || req.path.startsWith('/data/')) {
            return next();
        }
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

// 404 handler for unknown API routes
app.use('/api/{*splat}', (_req, res) => {
    errorResponse(res, 404, 'API endpoint not found');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    if (!isProduction) console.error(err.stack);

    const status = err.status || err.statusCode || 500;
    const message = isProduction && status === 500
        ? 'An internal server error occurred'
        : err.message || 'Something went wrong!';

    errorResponse(res, status, message, !isProduction ? err.stack : undefined);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`\n🔱 Dharma Setu Server running on port ${PORT}`);
    console.log(`   Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`   API:  http://localhost:${PORT}/api\n`);
});

// Graceful shutdown
const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
    // Force close after 10s
    setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;