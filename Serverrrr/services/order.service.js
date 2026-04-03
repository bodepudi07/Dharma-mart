// services/order.service.js
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

// generate unique order ID
const generateOrderId = () => {
  return "ORD_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
};

// CREATE ORDER
export const createOrder = async (data) => {
  const { items, customer } = data;

  if (!items || items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    if (!mongoose.Types.ObjectId.isValid(item.productId)) {
      throw new Error("Invalid product ID");
    }

    const product = await Product.findById(item.productId);

    if (!product || !product.isActive) {
      throw new Error("Product not available");
    }

    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.title}`);
    }

    const itemTotal = product.price * item.quantity;

    totalAmount += itemTotal;

    orderItems.push({
      productId: product._id,
      title: product.title,
      price: product.price,
      quantity: item.quantity
    });

    // 🔥 reduce stock
    product.stock -= item.quantity;
    await product.save();
  }

  const order = await Order.create({
    orderId: generateOrderId(),
    items: orderItems,
    amount: totalAmount,
    customer
  });

  return order;
};


// GET ORDER
export const getOrderById = async (id) => {
  const order = await Order.findById(id);

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};


// GET ALL ORDERS (admin)
export const getAllOrders = async () => {
  return Order.find().sort({ createdAt: -1 });
};


// UPDATE STATUS (after payment)
export const updateOrderStatus = async (orderId, status, paymentData = {}) => {
  const order = await Order.findOne({ orderId });

  if (!order) {
    throw new Error("Order not found");
  }

  order.status = status;

  if (paymentData.paymentSessionId) {
    order.paymentSessionId = paymentData.paymentSessionId;
  }

  if (paymentData.paymentOrderId) {
    order.paymentOrderId = paymentData.paymentOrderId;
  }

  await order.save();

  return order;
};