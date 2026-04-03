// routes/order.routes.js

import express from "express";
import * as orderController from "../controllers/order.controller.js";
import { adminAuth } from "../middleware/admin.middleware.js";

const router = express.Router();


// CUSTOMER
router.post("/", orderController.create);
router.get("/:id", orderController.getOne);


// ADMIN
router.get("/", adminAuth, orderController.getAll);


// PAYMENT (webhook / manual)
router.post("/status", orderController.updateStatus);

export default router;