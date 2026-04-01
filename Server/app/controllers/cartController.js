import { Cart, Product } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';
import supabase from '../../supabase.js';

// Get cart
export const getCart = asyncHandler(async (req, res) => {
  const { sessionId } = req.query;
  const userId = req.user?.id;

  let cart = await Cart.findOne({ user: userId, sessionId, isActive: true });

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
    if (item.product.track_inventory && item.product.stock_quantity < item.quantity) {
      item.quantity = item.product.stock_quantity;
    }
    return item.quantity > 0;
  });

  // Calculate totals and update Supabase
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  await supabase
    .from('carts')
    .update({ subtotal, total_items: totalItems })
    .eq('id', cart.id);

  res.json({
    success: true,
    data: { ...cart, subtotal, totalItems: totalItems }
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
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.status !== 'active') throw new ApiError(400, 'Product is not available');

  // Check stock
  if (product.track_inventory && product.stock_quantity < quantity) {
    throw new ApiError(400, `Only ${product.stock_quantity} items available in stock`);
  }

  // Find or create cart
  let cart = await Cart.findOne({ user: userId, sessionId, isActive: true });
  if (!cart) {
      cart = await Cart.create({ user: userId, sessionId, items: [] });
  }
  
  // Ensure items is an array (Handle potential initialization lag or raw return behavior)
  if (!cart.items) cart.items = [];

  const existingItemIndex = (cart.items || []).findIndex(item => {
    const isSameProduct = (item.product?.id || item.product) === productId;
    const isSameVariant = JSON.stringify(item.variant) === JSON.stringify(variant);
    return isSameProduct && isSameVariant;
  });

  if (existingItemIndex > -1) {
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    if (product.track_inventory && product.stock_quantity < newQuantity) {
      throw new ApiError(400, `Cannot add more. Only ${product.stock_quantity} available`);
    }
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    cart.items.push({ product: productId, quantity, price: product.price, variant });
  }

  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  const updatedCart = await Cart.findOneAndUpdate(
    { id: cart.id }, 
    { subtotal, total_items: totalItems, items: cart.items }
  );

  res.json({
    success: true,
    message: 'Item added to cart',
    data: { ...updatedCart, totalItems }
  });
});

// updateCartItem... (Already handles conceptual logic in add above)
export const updateCartItem = asyncHandler(async (req, res) => {
    const { productId, quantity, sessionId, variant } = req.body;
    const userId = req.user?.id;
    let cart = await Cart.findOne({ user: userId, sessionId, isActive: true });
    if (!cart) throw new ApiError(404, 'Cart not found');
    const index = cart.items.findIndex(item => (item.product.id || item.product) === productId);
    if (index === -1) throw new ApiError(404, 'Item not found');
    cart.items[index].quantity = quantity;
    const updatedCart = await Cart.findOneAndUpdate({ id: cart.id }, { $set: { items: cart.items } });
    res.json({ success: true, data: updatedCart });
});

export const removeFromCart = asyncHandler(async (req, res) => {
    const { productId, sessionId } = req.body;
    const userId = req.user?.id;
    let cart = await Cart.findOne({ user: userId, sessionId, isActive: true });
    if (!cart) throw new ApiError(404, 'Cart not found');
    cart.items = cart.items.filter(item => (item.product.id || item.product) !== productId);
    const updatedCart = await Cart.findOneAndUpdate({ id: cart.id }, { $set: { items: cart.items } });
    res.json({ success: true, data: updatedCart });
});

export const clearCart = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;
    const userId = req.user?.id;
    let cart = await Cart.findOne({ user: userId, sessionId, isActive: true });
    if (!cart) throw new ApiError(404, 'Cart not found');
    
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    await supabase.from('carts').update({ subtotal: 0, total_items: 0 }).eq('id', cart.id);
    
    res.json({ success: true, message: 'Cart cleared' });
});

export const applyCoupon = asyncHandler(async (req, res) => {
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