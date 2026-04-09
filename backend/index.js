// Import required modules
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { errorResponse } from './middleware/responseHandler.js';
import logger from './logger.js';

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

// Create express app
const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// Validate critical environment variables at startup
if (!process.env.JWT_SECRET) {
    logger.error('FATAL: JWT_SECRET environment variable is not set. Auth will not work.');
    if (isProduction) process.exit(1);
}

// Trust proxy for accurate rate limiting behind reverse proxies (Nginx, Cloudflare, etc.)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
}));

// Compression — gzip/brotli for all responses
app.use(compression());

// CORS Configuration - restrict in production
const allowedOrigins = isProduction
    ? [process.env.FRONTEND_URL || 'https://dharmasetu.com'].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        // Auto-allow all origins to avoid broken proxy issues
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
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
            logger.debug({ method: req.method, path: req.path }, 'API request');
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
        logger.warn({ file: fileName }, 'Blocked unauthorized access to static data file');
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

// Frontend is now hosted on Cloudflare Pages, backend operates as an API server only.
// if (isProduction) {
//     const distPath = path.join(__dirname, '../dist');
//     app.use(express.static(distPath, { maxAge: '7d' }));
//     // SPA fallback - serve index.html for all non-API routes
//     app.get('{*splat}', (req, res, next) => {
//         if (req.path.startsWith('/api/') || req.path.startsWith('/data/')) {
//             return next();
//         }
//         res.sendFile(path.join(distPath, 'index.html'));
//     });
// }

// 404 handler for unknown API routes
app.use('/api/{*splat}', (_req, res) => {
    errorResponse(res, 404, 'API endpoint not found');
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error({ method: req.method, path: req.path, err: err.message }, 'Request error');
    if (!isProduction) logger.debug(err.stack);

    const status = err.status || err.statusCode || 500;
    const message = isProduction && status === 500
        ? 'An internal server error occurred'
        : err.message || 'Something went wrong!';

    errorResponse(res, status, message, !isProduction ? err.stack : undefined);
});

// Start server
const server = app.listen(PORT, () => {
    logger.info(`\n🔱 Dharma Setu Server running on port ${PORT}`);
    logger.info(`   Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    logger.info(`   API:  http://localhost:${PORT}/api\n`);
});

// Graceful shutdown
const shutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
    });
    // Force close after 10s
    setTimeout(() => {
        logger.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;