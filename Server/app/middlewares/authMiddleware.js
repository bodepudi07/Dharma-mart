import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { ApiError, asyncHandler } from './errorHandler.js';

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-secret-key');

      // Add user to request
      const user = await User.findById(decoded.id);
      
      if (!user) {
          throw new ApiError(401, 'User no longer exists');
      }

      // Remove sensitive data (password already selected *-* in SQL or excluded here)
      const { password, ...safeUser } = user;
      req.user = safeUser;
      
      next();
    } catch (error) {
      console.error(error);
      throw new ApiError(401, 'Not authorized, token failed');
    }
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token');
  }
});

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `User role ${req.user.role} is not authorized to access this route`
      );
    }
    next();
  };
};

export default {
  protect,
  authorize
};
