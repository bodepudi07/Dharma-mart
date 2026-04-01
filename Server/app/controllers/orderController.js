import { Order, Cart, Product } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';
import { createCashfreeOrder, getOrderDetails, processRefund } from '../services/cashfreeService.js';
import supabase from '../../supabase.js';

// Create new order
export const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    customerDetails,
    notes,
    sessionId: requestSessionId
  } = req.body;

  const userId = req.user?.id;
  const sessionId = requestSessionId;

  // Aggregate items by productId + variant
  const aggregatedItemsMap = new Map();
  for (const item of items) {
    const key = `${item.productId}-${item.variant ? JSON.stringify(item.variant) : 'default'}`;
    if (aggregatedItemsMap.has(key)) {
      aggregatedItemsMap.get(key).quantity += item.quantity;
    } else {
      aggregatedItemsMap.set(key, { ...item });
    }
  }

  const aggregatedItems = Array.from(aggregatedItemsMap.values());

  // Pass 1: Validate stock upfront to prevent partial stock decrement
  const productStockMap = new Map();
  for (const item of aggregatedItems) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new ApiError(404, `Product not found: ${item.productId}`);
    }

    if (product.status !== 'active') {
      throw new ApiError(400, `Product is not available: ${product.name}`);
    }

    if (product.track_inventory && product.stock_quantity < item.quantity) {
      throw new ApiError(400, `Insufficient stock for: ${product.name}. Available: ${product.stock_quantity}`);
    }
    
    productStockMap.set(`${item.productId}-${item.variant ? JSON.stringify(item.variant) : 'default'}`, { product, quantity: item.quantity, variant: item.variant });
  }

  // Pass 2: Decrement stock and calculate totals
  let subtotal = 0;
  const orderItems = [];

  for (const [key, { product, quantity, variant }] of productStockMap) {
    // Atomic update in Supabase (simplified check then update here)
    if (product.track_inventory) {
      const { error: stockError } = await supabase
        .from('products')
        .update({ stock_quantity: product.stock_quantity - quantity })
        .eq('id', product.id)
        .gte('stock_quantity', quantity); // Extra guard for race conditions
      
      if (stockError) throw new ApiError(400, `Failed to update stock for: ${product.name}`);
    }

    const itemTotal = product.price * quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product.id,
      name: product.name,
      sku: product.sku,
      quantity: quantity,
      price: product.price,
      totalPrice: itemTotal,
      image: { url: product.thumbnail_url, publicId: product.thumbnail_public_id },
      vendor: product.vendor_id,
      variant: variant
    });
  }

  // Calculate tax/shipping (hardcoded as in mongoose version)
  const taxAmount = subtotal * 0.18;
  const shippingCost = subtotal >= 500 ? 0 : 50;
  const totalAmount = subtotal + taxAmount + shippingCost;

  // Generate order number
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  const orderNumber = `ORD-${timestamp}-${random}`;

  // Create order
  const order = await Order.create({
    orderNumber,
    user: userId,
    guestEmail: !userId ? customerDetails.email : undefined,
    items: orderItems,
    shippingAddress,
    billingAddress: billingAddress || shippingAddress,
    payment: {
      method: paymentMethod,
      amount: totalAmount,
      currency: 'INR',
      status: 'pending'
    },
    subtotal,
    taxAmount,
    shippingCost,
    totalAmount,
    notes,
    metadata: {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // online payment session... (already handled by service layer)
  let paymentSession = null;
  if (paymentMethod !== 'cod') {
    const cashfreeOrder = await createCashfreeOrder({
      orderId: order.order_number,
      orderAmount: totalAmount,
      customerDetails: {
        customerId: userId || `GUEST_${Date.now()}`,
        name: shippingAddress.fullName,
        email: customerDetails.email || shippingAddress.email,
        phone: shippingAddress.phone
      }
    });

    // Update order with cashfree ID
    await supabase.from('orders').update({ cashfree_order_id: cashfreeOrder.orderId }).eq('id', order.id);
    
    paymentSession = {
      orderId: cashfreeOrder.orderId,
      paymentSessionId: cashfreeOrder.paymentSessionId,
      orderStatus: cashfreeOrder.orderStatus
    };
  }

  // Clear cart
  if (userId) {
    await Cart.findOneAndUpdate({ user: userId }, { $set: { items: [], subtotal: 0, totalItems: 0 } });
  } else if (sessionId) {
    await Cart.findOneAndUpdate({ sessionId: sessionId }, { $set: { items: [], subtotal: 0, totalItems: 0 } });
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: {
      order,
      paymentSession
    }
  });
});

// getAllOrders (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  let q = Order.find();
  if (status && status !== 'all') q = q.eq('status', status);
  if (search) q = q.or(`order_number.ilike.%${search}%,guest_email.ilike.%${search}%`);

  const { data: orders, count, error } = await q.range(from, to).select('*', { count: 'exact' });
  if (error) throw error;

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / parseInt(limit))
    }
  });
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.user.id;

  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  let q = Order.find({ user: userId });
  if (status && status !== 'all') q = q.eq('status', status);

  const { data: orders, count, error } = await q.range(from, to).select('*', { count: 'exact' });
  if (error) throw error;

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / parseInt(limit))
    }
  });
});

// Other methods... (getUserOrders, getOrder, updateOrderStatus, cancelOrder simplified for migration)
export const getOrder = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await Order.findOne({ _id: id.match(/^[0-9a-fA-F-]{36}$/) ? id : undefined, orderNumber: !id.match(/^[0-9a-fA-F-]{36}$/) ? id : undefined });
    if (!order) throw new ApiError(404, 'Order not found');
    res.json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, note } = req.body;
    const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    // Audit log
    await supabase.from('order_status_history').insert([{ order_id: id, status, note, updated_by: req.user?.id }]);
    res.json({ success: true, data });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user.id;

  const order = await Order.findById(id);
  if (!order) throw new ApiError(404, 'Order not found');

  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new ApiError(400, 'Order cannot be cancelled in its current state');
  }

  // Restore stock
  // (Simplified: in a real app, you'd use a transaction or RPC)
  for (const item of order.items) {
    const product = await Product.findById(item.product.id || item.product);
    if (product && product.track_inventory) {
      await supabase.from('products').update({ stock_quantity: product.stock_quantity + item.quantity }).eq('id', product.id);
    }
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ 
      status: 'cancelled',
      cancellation_reason: reason,
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  res.json({ success: true, data });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const paymentDetails = await getOrderDetails(orderId);
  
  if (paymentDetails.orderStatus === 'PAID') {
    await supabase.from('orders').update({ payment_status: 'completed', paid_at: new Date().toISOString() }).eq('order_number', orderId);
  }

  res.json({ success: true, data: paymentDetails });
});

export const paymentWebhook = asyncHandler(async (req, res) => {
  // Cashfree webhook handling simplified for migration
  // In a real app, you'd verify the signature here
  const { order, payment } = req.body;
  
  if (payment.payment_status === 'SUCCESS') {
    await supabase.from('orders').update({ 
        payment_status: 'completed', 
        paid_at: new Date().toISOString(),
        cashfree_payment_id: payment.cf_payment_id
    }).eq('order_number', order.order_id);
  }

  res.json({ success: true });
});

export default {
  createOrder,
  getAllOrders,
  getOrder,
  getUserOrders,
  updateOrderStatus,
  cancelOrder,
  verifyPayment,
  paymentWebhook
};