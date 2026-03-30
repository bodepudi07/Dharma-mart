import { Cart, Product } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';

// Get cart
export const getCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.query;
  const userId = req.user?.id;

  let cart;

  if (userId) {
    cart = await Cart.findOne({ user: userId, isActive: true })
      .populate('items.product', 'name price images thumbnail stock status');
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId, isActive: true })
      .populate('items.product', 'name price images thumbnail stock status');
  }

  if (!cart) {
    return res.json({
      success: true,
      data: {
        items: [],
        subtotal: 0,
        totalItems: 0
      }
    });
  }

  // Filter out products that are no longer active or out of stock
  cart.items = cart.items.filter(item => {
    if (!item.product) return false;
    if (item.product.status !== 'active') return false;
    if (item.product.stock.quantity < item.quantity) {
      item.quantity = item.product.stock.quantity;
    }
    return item.quantity > 0;
  });

  await cart.save();

  res.json({
    success: true,
    data: cart
  });
});

// Add item to cart
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, sessionId, variant } = req.body;
  const userId = req.user?.id;

  if (!userId && !sessionId) {
    throw new ApiError(400, 'User ID or session ID is required');
  }

  // Verify product exists and is active
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.status !== 'active') {
    throw new ApiError(400, 'Product is not available');
  }

  // Check stock
  if (product.stock.trackInventory && product.stock.quantity < quantity) {
    throw new ApiError(400, `Only ${product.stock.quantity} items available in stock`);
  }

  // Find or create cart
  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, isActive: true });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
  } else {
    cart = await Cart.findOne({ sessionId, isActive: true });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }
  }

  // Check if item already in cart
  const existingItemIndex = cart.items.findIndex(item => {
    if (item.product.toString() !== productId) return false;
    if (variant && item.variant) {
      return JSON.stringify(item.variant) === JSON.stringify(variant);
    }
    return !variant && !item.variant;
  });

  if (existingItemIndex > -1) {
    // Update quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    if (product.stock.trackInventory && product.stock.quantity < newQuantity) {
      throw new ApiError(400, `Cannot add more. Only ${product.stock.quantity} items available in stock`);
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({
      product: productId,
      quantity,
      price: product.price,
      variant
    });
  }

  await cart.save();

  const populatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name price images thumbnail stock status');

  res.json({
    success: true,
    message: 'Item added to cart',
    data: populatedCart
  });
});

// Update cart item quantity
export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity, sessionId, variant } = req.body;
  const userId = req.user?.id;

  if (!userId && !sessionId) {
    throw new ApiError(400, 'User ID or session ID is required');
  }

  if (quantity < 1) {
    throw new ApiError(400, 'Quantity must be at least 1');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (product.stock.trackInventory && product.stock.quantity < quantity) {
    throw new ApiError(400, `Only ${product.stock.quantity} items available in stock`);
  }

  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, isActive: true });
  } else {
    cart = await Cart.findOne({ sessionId, isActive: true });
  }

  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  const itemIndex = cart.items.findIndex(item => {
    if (item.product.toString() !== productId) return false;
    if (variant && item.variant) {
      return JSON.stringify(item.variant) === JSON.stringify(variant);
    }
    return !variant && !item.variant;
  });

  if (itemIndex === -1) {
    throw new ApiError(404, 'Item not found in cart');
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  const populatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name price images thumbnail stock status');

  res.json({
    success: true,
    message: 'Cart updated',
    data: populatedCart
  });
});

// Remove item from cart
export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId, sessionId, variant } = req.body;
  const userId = req.user?.id;

  if (!userId && !sessionId) {
    throw new ApiError(400, 'User ID or session ID is required');
  }

  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, isActive: true });
  } else {
    cart = await Cart.findOne({ sessionId, isActive: true });
  }

  if (!cart) {
    throw new ApiError(404, 'Cart not found');
  }

  const itemIndex = cart.items.findIndex(item => {
    if (item.product.toString() !== productId) return false;
    if (variant && item.variant) {
      return JSON.stringify(item.variant) === JSON.stringify(variant);
    }
    return !variant && !item.variant;
  });

  if (itemIndex === -1) {
    throw new ApiError(404, 'Item not found in cart');
  }

  cart.items.splice(itemIndex, 1);
  await cart.save();

  const populatedCart = await Cart.findById(cart._id)
    .populate('items.product', 'name price images thumbnail stock status');

  res.json({
    success: true,
    message: 'Item removed from cart',
    data: populatedCart
  });
});

// Clear cart
export const clearCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const userId = req.user?.id;

  let cart;
  if (userId) {
    cart = await Cart.findOne({ user: userId, isActive: true });
  } else if (sessionId) {
    cart = await Cart.findOne({ sessionId, isActive: true });
  }

  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.json({
    success: true,
    message: 'Cart cleared',
    data: {
      items: [],
      subtotal: 0,
      totalItems: 0
    }
  });
});

// Apply coupon to cart
export const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode, sessionId } = req.body;
  const userId = req.user?.id;

  // This is a placeholder - implement coupon logic as needed
  throw new ApiError(501, 'Coupon functionality not implemented yet');
});

export default {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon
};