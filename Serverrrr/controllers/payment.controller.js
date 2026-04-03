import * as paymentService from "../services/payment.service.js";


// INITIATE PAYMENT
export const createSession = async (req, res) => {
  try {
    const { orderId } = req.body;

    const session = await paymentService.initiatePayment(orderId);

    res.status(200).json({
      success: true,
      data: session
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};


// WEBHOOK / VERIFY
export const webhook = async (req, res) => {
  try {
    const order = await paymentService.verifyPayment(req.body);

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