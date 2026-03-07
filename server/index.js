// Import required modules
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Create express app
const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for simple dev-to-prod flow, usually fine with Vite
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // set `RateLimit` and `RateLimit-Policy` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
});

// Apply the rate limiting middleware to all requests.
app.use('/api/', limiter);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from data folder, strictly allowing only public content
app.use('/data', (req, res, next) => {
    // SECURITY PATCH: Use an allow-list instead of a block-list to prevent data leaks.
    const publicFiles = [
        'temples', 'temples.te', 'temples.hi',
        'poojas', 'poojas.te', 'poojas.hi',
        'yatras', 'yatras.te', 'yatras.hi',
        'events', 'events.te', 'events.hi',
        'pandits', 'pandits.te', 'pandits.hi',
        'books', 'books.te', 'books.hi',
        'festivals', 'festivals.te', 'festivals.hi'
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
}, express.static(path.join(__dirname, '../data')));

// API Routes
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

// Serve frontend build (for production)
// app.use(express.static(path.join(__dirname, '../dist')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;