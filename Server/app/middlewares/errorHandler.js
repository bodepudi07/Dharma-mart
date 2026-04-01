// Custom error class for API errors
export class ApiError extends Error {
  constructor(statusCode, message, errors = [], stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Async handler wrapper to catch async errors
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Postgres/Supabase unique violation error
  if (err.code === '23505') {
    const detail = err.detail || '';
    const fieldMatch = detail.match(/\((.*?)\)=\((.*?)\)/);
    const message = fieldMatch 
      ? `Duplicate value for field: ${fieldMatch[1]}`
      : 'A record with this value already exists';
    error = new ApiError(400, message);
  }

  // Postgres/Supabase foreign key violation
  if (err.code === '23503') {
    error = new ApiError(400, 'Referenced record not found');
  }

  // Postgres/Supabase invalid input syntax (like CastError)
  if (err.code === '22P02') {
    error = new ApiError(400, 'Invalid input syntax (e.g. invalid UUID format)');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ApiError(400, 'File size too large');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new ApiError(400, 'Too many files');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new ApiError(400, 'Unexpected file field');
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route not found: ${req.originalUrl}`);
  next(error);
};

export default {
  ApiError,
  asyncHandler,
  errorHandler,
  notFoundHandler
};