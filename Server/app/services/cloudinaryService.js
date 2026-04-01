import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { ApiError } from '../middlewares/errorHandler.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload single file to Cloudinary
export const uploadToCloudinary = async (file, folder = 'dharma-mart', options = {}) => {
  try {
    if (!file || !file.buffer) {
      throw new ApiError(400, 'No file provided for upload');
    }

    // Compress and resize image using sharp
    let buffer = file.buffer;
    if (file.mimetype.startsWith('image/')) {
        buffer = await sharp(file.buffer)
            .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
            .toFormat('webp', { quality: 80 })
            .toBuffer();
    }

    // Convert buffer to base64
    const b64 = buffer.toString('base64');
    const dataURI = `data:image/webp;base64,${b64}`;

    // Upload options
    const uploadOptions = {
      folder,
      resource_type: 'auto',
      unique_filename: true,
      overwrite: false,
      ...options
    };

    const result = await cloudinary.uploader.upload(dataURI, uploadOptions);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to upload file: ${error.message}`);
  }
};

// Upload multiple files to Cloudinary
export const uploadMultipleToCloudinary = async (files, folder = 'dharma-mart', options = {}) => {
  try {
    if (!files || files.length === 0) {
      throw new ApiError(400, 'No files provided for upload');
    }

    const uploadPromises = files.map(file => uploadToCloudinary(file, folder, options));
    const results = await Promise.allSettled(uploadPromises);

    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push({
          file: files[index].originalname,
          error: result.reason.message
        });
      }
    });

    return { successful, failed };
  } catch (error) {
    throw new ApiError(500, `Failed to upload files: ${error.message}`);
  }
};

// Delete file from Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new ApiError(400, 'Public ID is required for deletion');
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== 'ok') {
      throw new ApiError(500, 'Failed to delete file from Cloudinary');
    }

    return { success: true, publicId };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, `Failed to delete file: ${error.message}`);
  }
};

// Delete multiple files from Cloudinary
export const deleteMultipleFromCloudinary = async (publicIds) => {
  try {
    if (!publicIds || publicIds.length === 0) {
      throw new ApiError(400, 'No public IDs provided for deletion');
    }

    const result = await cloudinary.api.delete_resources(publicIds);

    return result;
  } catch (error) {
    throw new ApiError(500, `Failed to delete files: ${error.message}`);
  }
};

// Generate optimized URL
export const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto',
    fetch_format: 'auto',
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
};

// Generate thumbnail URL
export const getThumbnailUrl = (publicId, width = 200, height = 200) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

// Get image details
export const getImageDetails = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    throw new ApiError(500, `Failed to get image details: ${error.message}`);
  }
};

export default {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
  getOptimizedUrl,
  getThumbnailUrl,
  getImageDetails
};