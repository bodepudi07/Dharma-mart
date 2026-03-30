import { Cashfree, CFEnvironment } from 'cashfree-pg';
import { ApiError } from '../middlewares/errorHandler.js';
import crypto from 'crypto';

// Initialize Cashfree instance
const cashfree = new Cashfree(
    // process.env.NODE_ENV === 'production' 
    // ? CFEnvironment.PRODUCTION 
    // : CFEnvironment.SANDBOX,
  CFEnvironment.SANDBOX,
  process.env.CASHFREE_APP_ID,
  process.env.CASHFREE_SECRET_KEY
);

// Create order for payment
export const createCashfreeOrder = async (orderData) => {
  try {
    const {
      orderId,
      orderAmount,
      orderCurrency = 'INR',
      customerDetails,
      orderNote = '',
      returnUrl = '',
      notifyUrl = ''
    } = orderData;

    const request = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: customerDetails.customerId || `CUST_${Date.now()}`,
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone
      },
      order_meta: {
        return_url: returnUrl || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-success?order_id={order_id}`,
        notify_url: notifyUrl || `${process.env.API_URL || 'http://localhost:8080'}/api/payments/webhook`
      },
      order_note: orderNote
    };

    const response = await cashfree.PGCreateOrder(request);
    
    return {
      orderId: response.data.order_id,
      paymentSessionId: response.data.payment_session_id,
      orderStatus: response.data.order_status
    };
  } catch (error) {
    console.error('Cashfree order creation error:', error);
    throw new ApiError(500, `Failed to create payment order: ${error.message}`);
  }
};

// Get payment session
export const getPaymentSession = async (orderId) => {
  try {
    const response = await cashfree.PGOrderFetchPayments(orderId);
    return response.data;
  } catch (error) {
    console.error('Cashfree fetch payments error:', error);
    throw new ApiError(500, `Failed to fetch payment details: ${error.message}`);
  }
};

// Get order details
export const getOrderDetails = async (orderId) => {
  try {
    const response = await cashfree.PGFetchOrder(orderId);
    return response.data;
  } catch (error) {
    console.error('Cashfree fetch order error:', error);
    throw new ApiError(500, `Failed to fetch order details: ${error.message}`);
  }
};

// Verify payment signature (Legacy/Manual)
export const verifyPaymentSignature = (orderId, orderAmount, referenceId, signature) => {
  try {
    const data = orderId + orderAmount.toString() + referenceId + process.env.CASHFREE_SECRET_KEY;
    const expectedSignature = crypto.createHash('sha256').update(data).digest('hex');
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// Process refund
export const processRefund = async (orderId, refundData) => {
  try {
    const {
      refundAmount,
      refundNote = '',
      refundId
    } = refundData;

    const request = {
      refund_amount: refundAmount,
      refund_id: refundId || `REF_${Date.now()}`,
      refund_note: refundNote
    };

    const response = await cashfree.PGOrderCreateRefund(orderId, request);
    
    return {
      refundId: response.data.refund_id,
      refundStatus: response.data.refund_status,
      refundAmount: response.data.refund_amount
    };
  } catch (error) {
    console.error('Cashfree refund error:', error);
    throw new ApiError(500, `Failed to process refund: ${error.message}`);
  }
};

// Get refund details
export const getRefundDetails = async (orderId, refundId) => {
  try {
    const response = await cashfree.PGOrderFetchRefund(orderId, refundId);
    return response.data;
  } catch (error) {
    console.error('Cashfree fetch refund error:', error);
    throw new ApiError(500, `Failed to fetch refund details: ${error.message}`);
  }
};

// Get all refunds for an order
export const getOrderRefunds = async (orderId) => {
  try {
    const response = await cashfree.PGOrderFetchRefunds(orderId);
    return response.data;
  } catch (error) {
    console.error('Cashfree fetch refunds error:', error);
    throw new ApiError(500, `Failed to fetch refunds: ${error.message}`);
  }
};

// Webhook signature verification
export const verifyWebhookSignature = (signature, rawBody, timestamp) => {
  try {
    const event = cashfree.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    return !!event;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
};

export default {
  createCashfreeOrder,
  getPaymentSession,
  getOrderDetails,
  verifyPaymentSignature,
  processRefund,
  getRefundDetails,
  getOrderRefunds,
  verifyWebhookSignature
};
