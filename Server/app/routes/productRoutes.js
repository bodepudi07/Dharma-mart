import express from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  addProductReview
} from '../controllers/productController.js';
import { uploadProductImages } from '../middlewares/upload.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/:id', getProduct);

// Protected routes
router.post('/', protect, authorize('admin', 'vendor'), uploadProductImages, createProduct);
router.put('/:id', protect, authorize('admin', 'vendor'), uploadProductImages, updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);
router.post('/:id/reviews', protect, addProductReview);

export default router;