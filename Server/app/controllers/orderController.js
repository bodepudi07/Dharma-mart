import { Order, Cart, Product } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';
import { createCashfreeOrder, getOrderDetails, processRefund } from '../services/cashfreeService.js';

// Create new order
export const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    billingAddress,
    paymentMethod,
    customerDetails,
    notes
  } = req.body;

  const userId = req.user?.id;
  const sessionId = req.body.sessionId;

  // Validate items and calculate totals
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new ApiError(404, `Product not found: ${item.productId}`);
    }

    if (product.status !== 'active') {
      throw new ApiError(400, `Product is not available: ${product.name}`);
    }

    if (product.stock.trackInventory && product.stock.quantity < item.quantity) {
      throw new ApiError(400, `Insufficient stock for: ${product.name}`);
    }

    const itemTotal = product.price * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      quantity: item.quantity,
      price: product.price,
      totalPrice: itemTotal,
      image: product.thumbnail,
      vendor: product.vendor,
      variant: item.variant
    });

    // Update stock
    if (product.stock.trackInventory) {
      product.stock.quantity -= item.quantity;
      await product.save();
    }
  }

  // Calculate tax (GST 18%)
  const taxAmount = subtotal * 0.18;

  // Calculate shipping (free above ₹500)
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
      status: paymentMethod === 'cod' ? 'pending' : 'pending'
    },
    subtotal,
    taxAmount,
    shippingCost,
    totalAmount,
    notes,
    metadata: {
      source: 'web',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  // Create payment order for online payments
  let paymentSession = null;
  if (paymentMethod !== 'cod') {
    const cashfreeOrder = await createCashfreeOrder({
      orderId: order.orderNumber,
      orderAmount: totalAmount,
      customerDetails: {
        customerId: userId || `GUEST_${Date.now()}`,
        name: shippingAddress.fullName,
        email: customerDetails.email || shippingAddress.email,
        phone: shippingAddress.phone
      }
    });

    order.payment.cashfreeOrderId = cashfreeOrder.orderId;
    await order.save();

    paymentSession = {
      orderId: cashfreeOrder.orderId,
      paymentSessionId: cashfreeOrder.paymentSessionId,
      orderStatus: cashfreeOrder.orderStatus
    };
  }

  // Clear cart
  if (userId) {
    await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [], subtotal: 0, totalItems: 0 } }
    );
  } else if (sessionId) {
    await Cart.findOneAndUpdate(
      { sessionId: sessionId },
      { $set: { items: [], subtotal: 0, totalItems: 0 } }
    );
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

// Get order by ID or order number
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = id.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: id }
    : { orderNumber: id };

  const order = await Order.findOne(query)
    .populate('items.product', 'name images')
    .populate('items.vendor', 'name');

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Check if user has access to this order
  const userId = req.user?.id;
  if (userId && order.user && order.user.toString() !== userId) {
    throw new ApiError(403, 'Access denied');
  }

  res.json({
    success: true,
    data: order
  });
});

// Get user orders
export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { page = 1, limit = 10, status } = req.query;

  const query = { user: userId };
  if (status && status !== 'all') {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('items.product', 'name images thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Update order status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note, trackingNumber, carrier, trackingUrl } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Validate status transition
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: ['returned'],
    cancelled: [],
    returned: ['refunded']
  };

  if (!validTransitions[order.status]?.includes(status)) {
    throw new ApiError(400, `Cannot transition from ${order.status} to ${status}`);
  }

  order.status = status;

  // Add to status history
  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
    updatedBy: req.user?.id
  });

  // Update tracking info
  if (status === 'shipped' && trackingNumber) {
    order.tracking = {
      trackingNumber,
      carrier,
      trackingUrl,
      shippedAt: new Date()
    };
  }

  if (status === 'delivered') {
    order.tracking.deliveredAt = new Date();
  }

  await order.save();

  res.json({
    success: true,
    message: 'Order status updated',
    data: order
  });
});

// Cancel order
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const userId = req.user?.id;

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Check ownership
  if (userId && order.user && order.user.toString() !== userId) {
    throw new ApiError(403, 'Access denied');
  }

  // Check if order can be cancelled
  if (['shipped', 'delivered', 'cancelled', 'returned'].includes(order.status)) {
    throw new ApiError(400, 'Order cannot be cancelled');
  }

  // Restore stock
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product && product.stock.trackInventory) {
      product.stock.quantity += item.quantity;
      await product.save();
    }
  }

  order.status = 'cancelled';
  order.cancellation = {
    reason,
    cancelledBy: userId,
    cancelledAt: new Date()
  };

  order.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: reason,
    updatedBy: userId
  });

  await order.save();

  // Process refund for paid orders
  if (order.payment.status === 'completed' && order.payment.cashfreeOrderId) {
    const refund = await processRefund(order.payment.cashfreeOrderId, {
      refundAmount: order.totalAmount,
      refundNote: reason || 'Order cancelled by customer'
    });

    order.payment.status = 'refunded';
    order.payment.refundAmount = order.totalAmount;
    order.payment.refundReason = reason;
    order.payment.refundedAt = new Date();
    await order.save();
  }

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// Verify payment
export const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, paymentId, signature } = req.body;

  const order = await Order.findOne({ 'payment.cashfreeOrderId': orderId });
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Get payment details from Cashfree
  const paymentDetails = await getOrderDetails(orderId);

  if (paymentDetails.order_status === 'PAID') {
    order.payment.status = 'completed';
    order.payment.cashfreePaymentId = paymentId;
    order.payment.paidAt = new Date();
    order.status = 'confirmed';

    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Payment received'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: order
    });
  } else {
    order.payment.status = 'failed';
    await order.save();

    throw new ApiError(400, 'Payment verification failed');
  }
});

// Payment webhook
export const paymentWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const body = JSON.stringify(req.body);

  // Verify webhook signature
  const { verifyWebhookSignature } = await import('../services/cashfreeService.js');
  if (!verifyWebhookSignature(signature, timestamp, body)) {
    throw new ApiError(400, 'Invalid webhook signature');
  }

  const { data } = req.body;
  const order = await Order.findOne({ 'payment.cashfreeOrderId': data.order?.order_id });

  if (!order) {
    return res.status(200).json({ success: true });
  }

  // Update payment status based on webhook event
  if (data.payment?.payment_status === 'SUCCESS') {
    order.payment.status = 'completed';
    order.payment.cashfreePaymentId = data.payment.cf_payment_id;
    order.payment.paidAt = new Date();
    order.status = 'confirmed';
  } else if (data.payment?.payment_status === 'FAILED') {
    order.payment.status = 'failed';
  }

  await order.save();

  res.status(200).json({ success: true });
});

// Get all orders (Admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const query = {};
  if (status && status !== 'all') {
    query.status = status;
  }

  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { guestEmail: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name images thumbnail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Order.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

export default {
  createOrder,
  getOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  verifyPayment,
  paymentWebhook
};