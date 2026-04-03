import axios from "axios";

// Validate the request body for creating an order
export const validateOrderRequest = (req, res, next) => {
  const { items, customer } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing items in the order"
    });
  }

  if (!customer || !customer.email || !customer.phone) {
    return res.status(400).json({
      success: false,
      message: "Invalid or missing customer details"
    });
  }

  next();
};

const isDev = process.env.NODE_ENV === "development";

const BASE_URL = isDev
  ? "https://sandbox.cashfree.com/pg/orders"
  : "https://api.cashfree.com/pg/orders";

const CASHFREE_CLIENT_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_SECRET_SECRET;

// Create Cashfree order
export const createCashfreeOrder = async (order) => {
  const payload = {
    order_id: order.orderId,
    order_amount: order.amount,
    order_currency: order.currency || "INR",

    customer_details: {
      customer_id: order.orderId,
      customer_email: order.customer?.email,
      customer_phone: order.customer?.phone
    }
  };

  const response = await axios.post(BASE_URL, payload, {
    headers: {
      "x-client-id": CASHFREE_CLIENT_ID,
      "x-client-secret": CASHFREE_CLIENT_SECRET,
      "x-api-version": "2022-09-01",
      "Content-Type": "application/json"
    }
  });

  return response.data;
};