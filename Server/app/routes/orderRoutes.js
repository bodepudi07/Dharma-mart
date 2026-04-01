import express from 'express';
import {
  createOrder,
  getOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  verifyPayment,
  paymentWebhook
} from '../controllers/orderController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/webhook', paymentWebhook);

// Protected routes
router.get('/', protect, authorize('admin'), getAllOrders);
router.post('/', createOrder); // Allow guest checkout or protected as needed
router.get('/my-orders', protect, getUserOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);
router.post('/:id/cancel', protect, cancelOrder);
router.post('/verify-payment', protect, verifyPayment);

export default router;