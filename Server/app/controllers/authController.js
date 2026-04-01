import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'test-secret-key', {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new ApiError(400, 'User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'user'
  });

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user.id || user._id, // Supabase uses "id" as default, but we may normalize to _id for frontend compatibility
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id || user._id)
      }
    });
  } else {
    throw new ApiError(400, 'Invalid user data');
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && (await User.comparePassword(password, user.password))) {
    res.json({
      success: true,
      data: {
        _id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id || user._id)
      }
    });
  } else {
    throw new ApiError(401, 'Invalid email or password');
  }
});

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id || req.user._id);
  
  if (user) {
    res.json({
      success: true,
      data: {
        _id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } else {
    throw new ApiError(404, 'User not found');
  }
});

export default {
  registerUser,
  loginUser,
  getMe
};
