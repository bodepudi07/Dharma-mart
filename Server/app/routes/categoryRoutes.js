import express from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree
} from '../controllers/categoryController.js';
import { uploadCategoryImage } from '../middlewares/upload.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategory);

// Admin routes
router.post('/', protect, authorize('admin'), uploadCategoryImage, createCategory);
router.put('/:id', protect, authorize('admin'), uploadCategoryImage, updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;