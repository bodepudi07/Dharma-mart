import Order from "../models/order.model.js";
import { createCashfreeOrder } from "../utils/cashfree.js";


// CREATE PAYMENT SESSION
export const initiatePayment = async (orderId) => {
  const order = await Order.findOne({ orderId });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status === "paid") {
    throw new Error("Order already paid");
  }

  const cfOrder = await createCashfreeOrder(order);

  // save payment session
  order.paymentSessionId = cfOrder.payment_session_id;
  order.paymentOrderId = cfOrder.order_id;

  await order.save();

  return cfOrder;
};


// VERIFY PAYMENT (Webhook or manual)
export const verifyPayment = async (data) => {
  const { order_id, order_status } = data;

  const order = await Order.findOne({ orderId: order_id });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order_status === "PAID") {
    order.status = "paid";
  } else if (order_status === "FAILED") {
    order.status = "failed";
  }

  await order.save();

  return order;
};