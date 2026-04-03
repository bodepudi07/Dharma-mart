import express from "express";
import * as paymentController from "../controllers/payment.controller.js";

const router = express.Router();


// create payment session
router.post("/create-session", paymentController.createSession);

// webhook (cashfree will call this)
router.post("/webhook", paymentController.webhook);

export default router;