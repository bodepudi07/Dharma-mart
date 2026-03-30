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

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategory);

// Admin routes (add authentication middleware as needed)
router.post('/', uploadCategoryImage, createCategory);
router.put('/:id', uploadCategoryImage, updateCategory);
router.delete('/:id', deleteCategory);

export default router;