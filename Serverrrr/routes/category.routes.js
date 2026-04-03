// routes/category.routes.js

import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import { adminAuth } from "../middleware/admin.middleware.js";

const router = express.Router();

//  Public (for frontend)
router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getOne);


// Admin only
router.post("/", adminAuth, categoryController.create);
router.put("/:id", adminAuth, categoryController.update);
router.delete("/:id", adminAuth, categoryController.remove);

export default router;