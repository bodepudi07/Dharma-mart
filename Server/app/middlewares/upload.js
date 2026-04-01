import multer from 'multer';
import { ApiError } from './errorHandler.js';

// Memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  const allowedTypes = [...allowedImageTypes, ...allowedDocTypes];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `File type ${file.mimetype} is not allowed`), false);
  }
};

// Create multer instance with default settings
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default
    files: 10 // Maximum 10 files
  }
});

// Single file upload
export const uploadSingle = (fieldName, maxSize = 10 * 1024 * 1024) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
      files: 1
    }
  }).single(fieldName);
};

// Multiple files upload (same field)
export const uploadMultiple = (fieldName, maxCount = 10, maxSize = 10 * 1024 * 1024) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
      files: maxCount
    }
  }).array(fieldName, maxCount);
};

// Multiple fields upload
export const uploadFields = (fields, maxSize = 10 * 1024 * 1024) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
      files: fields.reduce((sum, field) => sum + field.maxCount, 0)
    }
  }).fields(fields);
};

// Image only upload
export const uploadImage = (fieldName, maxCount = 1) => {
  const imageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, 'Only image files are allowed'), false);
    }
  };

  if (maxCount === 1) {
    return multer({
      storage,
      fileFilter: imageFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB for images
        files: 1
      }
    }).single(fieldName);
  }

  return multer({
    storage,
    fileFilter: imageFilter,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: maxCount
    }
  }).array(fieldName, maxCount);
};

// Product images upload (main image + gallery)
export const uploadProductImages = uploadFields([
  { name: 'mainImage', maxCount: 1 },
  { name: 'gallery', maxCount: 2 }
], 10 * 1024 * 1024);

// Category image upload
export const uploadCategoryImage = uploadSingle('image', 5 * 1024 * 1024);

// Vendor documents upload
export const uploadVendorDocs = uploadFields([
  { name: 'logo', maxCount: 1 },
  { name: 'banner', maxCount: 1 },
  { name: 'documents', maxCount: 5 }
], 10 * 1024 * 1024);

export default {
  upload,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadImage,
  uploadProductImages,
  uploadCategoryImage,
  uploadVendorDocs
};