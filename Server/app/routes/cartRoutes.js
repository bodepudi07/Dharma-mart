import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon
} from '../controllers/cartController.js';

const router = express.Router();

// All cart routes (add authentication middleware as needed)
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.post('/remove', removeFromCart);
router.post('/clear', clearCart);
router.post('/coupon', applyCoupon);

export default router;