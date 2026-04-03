// routes/product.routes.js

import express from "express";
import * as productController from "../controllers/product.controller.js";
import { adminAuth } from "../middleware/admin.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = express.Router();

// Public
router.get("/", productController.getAll);
router.get("/:id", productController.getOne);

// Admin (WITH IMAGE UPLOAD)
router.post(
  "/",
  adminAuth,
  upload.array("images", 5), // max 5 images
  productController.create
);

router.put(
  "/:id",
  adminAuth,
  upload.array("images", 5),
  productController.update
);

router.delete("/:id", adminAuth, productController.remove);

export default router;