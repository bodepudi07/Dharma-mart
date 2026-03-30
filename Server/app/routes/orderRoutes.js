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

const router = express.Router();

// Public routes
router.post('/webhook', paymentWebhook);

// Protected routes (add authentication middleware as needed)
router.get('/', getAllOrders);
router.post('/', createOrder);
router.get('/my-orders', getUserOrders);
router.get('/:id', getOrder);
router.put('/:id/status', updateOrderStatus);
router.post('/:id/cancel', cancelOrder);
router.post('/verify-payment', verifyPayment);

export default router;