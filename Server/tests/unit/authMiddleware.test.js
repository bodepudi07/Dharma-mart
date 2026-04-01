import { protect, authorize } from '../../app/middlewares/authMiddleware.js';
import { ApiError } from '../../app/middlewares/errorHandler.js';
import jwt from 'jsonwebtoken';
import { User } from '../../app/models/index.js';

jest.mock('jsonwebtoken');
jest.mock('../../app/models/index.js');

describe('Auth Middleware Unit Test', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  describe('protect middleware', () => {
    it('should throw error if no token provided', async () => {
      await expect(protect(req, res, next)).rejects.toThrow(ApiError);
      await expect(protect(req, res, next)).rejects.toThrow('Not authorized, no token');
    });

    it('should throw error if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      await expect(protect(req, res, next)).rejects.toThrow(ApiError);
      await expect(protect(req, res, next)).rejects.toThrow('Not authorized, token failed');
    });

    it('should set req.user if token is valid', async () => {
      const mockUser = { id: '123', name: 'Test User', role: 'user' };
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: '123' });
      User.findById.mockResolvedValue(mockUser);

      await protect(req, res, next);
      
      expect(User.findById).toHaveBeenCalledWith('123');
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual(mockUser);
    });
  });

  describe('authorize middleware', () => {
    it('should call next if user role is authorized', () => {
      req.user = { role: 'admin' };
      const middleware = authorize('admin', 'vendor');
      
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should throw error if user role is not authorized', () => {
      req.user = { role: 'user' };
      const middleware = authorize('admin');
      
      expect(() => middleware(req, res, next)).toThrow(ApiError);
      expect(() => middleware(req, res, next)).toThrow('User role user is not authorized to access this route');
    });
  });
});
