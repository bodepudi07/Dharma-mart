import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import joi from 'joi';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

// --- ACCESS CODE SYSTEM ---
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours in milliseconds

const requestCodeSchema = joi.object({
    email: joi.string().email().required()
});

const verifyCodeSchema = joi.object({
    code: joi.string().length(6).required()
});

// Generate a unique 6-character alphanumeric access code
function generateAccessCode() {
    return crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
}

// POST /api/auth/request-code — Generate and store an access code, return it (email sending simulated)
router.post('/request-code', validateRequest(requestCodeSchema), async (req, res, next) => {
    try {
        const { email } = req.body;

        // Generate a unique code
        let code;
        let exists = true;
        while (exists) {
            code = generateAccessCode();
            exists = !!(await db.findOne('access_codes.json', c => c.code === code));
        }

        const now = new Date();
        const accessCodeEntry = {
            code,
            email,
            createdAt: now.toISOString(),
            activatedAt: null,
            expiresAt: null,
            isUsed: false,
            isBlacklisted: false
        };

        await db.insert('access_codes.json', accessCodeEntry);

        // In production, you'd send an email here. For now, return the code directly.
        console.log(`[ACCESS CODE] Code ${code} generated for ${email}`);

        return standardResponse(res, 200, { code, email }, `Access code sent to ${email}. It will expire after a single use of 8 hours.`);
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/verify-code — Validate code, blacklist it, issue 8h JWT
router.post('/verify-code', validateRequest(verifyCodeSchema), async (req, res, next) => {
    try {
        const { code } = req.body;

        const accessCode = await db.findOne('access_codes.json', c => c.code === code.toUpperCase());

        if (!accessCode) {
            return errorResponse(res, 404, 'Invalid access code. Please check and try again.');
        }

        if (accessCode.isBlacklisted) {
            return errorResponse(res, 403, 'This access code has already been used and is no longer valid.');
        }

        if (accessCode.isUsed && accessCode.expiresAt) {
            const expiresAt = new Date(accessCode.expiresAt).getTime();
            if (Date.now() > expiresAt) {
                // Code expired, blacklist it
                await db.update('access_codes.json', accessCode.id, { isBlacklisted: true });
                return errorResponse(res, 403, 'This access code has expired. Your 8-hour session has ended.');
            }
            // Still within the session window — re-issue a token for the remaining time
            const remainingMs = expiresAt - Date.now();
            const remainingSeconds = Math.floor(remainingMs / 1000);

            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not defined in environment variables');
            }

            const token = jwt.sign(
                { codeId: accessCode.id, email: accessCode.email, role: 'exclusive_user' },
                process.env.JWT_SECRET,
                { expiresIn: remainingSeconds }
            );

            return standardResponse(res, 200, {
                token,
                expiresAt: accessCode.expiresAt,
                remainingMs,
                email: accessCode.email
            }, 'Welcome back! Your session is still active.');
        }

        // First-time activation
        const now = new Date();
        const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

        await db.update('access_codes.json', accessCode.id, {
            isUsed: true,
            activatedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
        });

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const token = jwt.sign(
            { codeId: accessCode.id, email: accessCode.email, role: 'exclusive_user' },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        console.log(`[ACCESS CODE] Code ${code} activated by ${accessCode.email}. Expires at ${expiresAt.toISOString()}`);

        return standardResponse(res, 200, {
            token,
            expiresAt: expiresAt.toISOString(),
            remainingMs: SESSION_DURATION_MS,
            email: accessCode.email
        }, 'Access granted! You have 8 hours of exclusive access.');
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/session-status — Return remaining session time
router.get('/session-status', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return errorResponse(res, 401, 'Access token required');
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const accessCode = await db.findOne('access_codes.json', c => c.id === decoded.codeId);

        if (!accessCode || accessCode.isBlacklisted) {
            return errorResponse(res, 403, 'Session expired or invalid.');
        }

        if (!accessCode.expiresAt) {
            return errorResponse(res, 403, 'Session not activated.');
        }

        const expiresAt = new Date(accessCode.expiresAt).getTime();
        const remainingMs = Math.max(0, expiresAt - Date.now());

        if (remainingMs === 0) {
            await db.update('access_codes.json', accessCode.id, { isBlacklisted: true });
            return errorResponse(res, 403, 'Your 8-hour session has expired.');
        }

        return standardResponse(res, 200, {
            remainingMs,
            expiresAt: accessCode.expiresAt,
            email: accessCode.email
        }, 'Session active.');
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return errorResponse(res, 403, 'Session expired. Please use a new access code.');
        }
        next(error);
    }
});

const registerSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().min(8).required(),
    phone: joi.string().allow('', null)
});

const loginSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required()
});

// Register a new user
router.post('/register', validateRequest(registerSchema), async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        const existingUser = await db.findOne('users.json', u => u.email === email);

        if (existingUser) {
            return errorResponse(res, 409, 'User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            name,
            email,
            password: hashedPassword,
            phone: phone || '',
            role: 'user',
            createdAt: new Date().toISOString()
        };

        const insertedUser = await db.insert('users.json', newUser);

        const { password: _, ...userWithoutPassword } = insertedUser;
        return standardResponse(res, 201, { user: userWithoutPassword }, 'User registered successfully');
    } catch (error) {
        next(error);
    }
});

// Login user
router.post('/login', validateRequest(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await db.findOne('users.json', u => u.email === email);

        if (!user) {
            return errorResponse(res, 401, 'Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return errorResponse(res, 401, 'Invalid credentials');
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = user;
        return standardResponse(res, 200, { user: userWithoutPassword, token }, 'Login successful');
    } catch (error) {
        next(error);
    }
});

// Google Sign-In
const googleSchema = joi.object({
    credential: joi.string().required(),
    mock: joi.boolean().optional(),
    name: joi.string().when('mock', { is: true, then: joi.required() }),
    email: joi.string().email().when('mock', { is: true, then: joi.required() })
});

router.post('/google', validateRequest(googleSchema), async (req, res, next) => {
    try {
        const { credential, mock, name: mockName, email: mockEmail } = req.body;
        let payload;

        if (mock && credential === 'mock_google_credential') {
            // Mock mode for local development
            payload = { email: mockEmail, name: mockName, picture: '' };
        } else {
            const clientId = process.env.GOOGLE_CLIENT_ID;
            if (!clientId || clientId === 'your_google_client_id_here') {
                return errorResponse(res, 500, 'Google Sign-In is not configured on the server.');
            }

            const client = new OAuth2Client(clientId);
            try {
                const ticket = await client.verifyIdToken({
                    idToken: credential,
                    audience: clientId,
                });
                payload = ticket.getPayload();
            } catch (err) {
                return errorResponse(res, 401, 'Invalid Google credential');
            }
        }

        if (!payload || !payload.email) {
            return errorResponse(res, 401, 'Invalid Google credential');
        }

        // Find or create user
        let user = await db.findOne('users.json', u => u.email === payload.email);

        if (!user) {
            // Create new user from Google profile
            const newUser = {
                name: payload.name || payload.email.split('@')[0],
                email: payload.email,
                password: '',
                phone: '',
                role: 'user',
                avatarUrl: payload.picture || '',
                createdAt: new Date().toISOString(),
                authProvider: 'google'
            };
            user = await db.insert('users.json', newUser);
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        const { password: _, ...userWithoutPassword } = user;
        return standardResponse(res, 200, { user: userWithoutPassword, token }, 'Login successful');
    } catch (error) {
        next(error);
    }
});

// Verify token
router.get('/verify', async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return errorResponse(res, 401, 'Access token required');
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await db.findOne('users.json', u => u.id === decoded.id);

        if (!user) {
            return errorResponse(res, 401, 'User not found');
        }

        const { password: _, ...userWithoutPassword } = user;
        return standardResponse(res, 200, { user: { ...userWithoutPassword, token } }, 'Token verified');
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return errorResponse(res, 401, 'Invalid or expired token');
        }
        next(error);
    }
});

export default router;