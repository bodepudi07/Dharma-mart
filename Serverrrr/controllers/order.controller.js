// controllers/order.controller.js
import * as orderService from "../services/order.service.js";

// CREATE ORDER (customer)
export const create = async (req, res) => {
  try {
    const order = await orderService.createOrder(req.body);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};


// GET ORDER
export const getOne = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message
    });
  }
};


// ADMIN: GET ALL ORDERS
export const getAll = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// 🔥 PAYMENT SUCCESS / FAILURE (for webhook later)
export const updateStatus = async (req, res) => {
  try {
    const { orderId, status, paymentSessionId, paymentOrderId } = req.body;

    const order = await orderService.updateOrderStatus(orderId, status, {
      paymentSessionId,
      paymentOrderId
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};