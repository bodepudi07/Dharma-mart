import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import joi from 'joi';
import db from '../db.js';
import { standardResponse, errorResponse } from '../middleware/responseHandler.js';
import { validateRequest } from '../middleware/validator.js';

const router = express.Router();

const registerSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
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