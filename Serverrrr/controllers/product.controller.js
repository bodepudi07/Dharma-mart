// controllers/product.controller.js

import * as productService from "../services/product.service.js";
import { uploadBuffer } from "../utils/uploadToCloudinary.js";

// CREATE
export const create = async (req, res) => {
  try {
    // ✅ safe JSON parse
    if (req.body.dynamicFields && typeof req.body.dynamicFields === "string") {
      try {
        const parsed = JSON.parse(req.body.dynamicFields);
        req.body.dynamicFields = new Map(Object.entries(parsed));
      } catch {
        throw new Error("Invalid JSON in dynamicFields");
      }
    }

    let images = [];

    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        throw new Error("Maximum 5 images allowed");
      }

      images = await Promise.all(
        req.files.map(file => uploadBuffer(file.buffer))
      );
    }

    const product = await productService.createProduct({
      ...req.body,
      images
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// GET ALL
export const getAll = async (req, res) => {
  try {
    const result = await productService.getAllProducts(req.query);

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// GET ONE
export const getOne = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message
    });
  }
};

// UPDATE
export const update = async (req, res) => {
  try {
    if (req.body.dynamicFields && typeof req.body.dynamicFields === "string") {
      try {
        const parsed = JSON.parse(req.body.dynamicFields);
        req.body.dynamicFields = new Map(Object.entries(parsed));
      } catch {
        throw new Error("Invalid JSON in dynamicFields");
      }
    }

    let images = [];

    if (req.files && req.files.length > 0) {
      if (req.files.length > 5) {
        throw new Error("Maximum 5 images allowed");
      }

      images = await Promise.all(
        req.files.map(file => uploadBuffer(file.buffer))
      );
    }

    const updateData = { ...req.body };

    if (images.length > 0) {
      updateData.images = images;
    }

    const product = await productService.updateProduct(
      req.params.id,
      updateData
    );

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// DELETE
export const remove = async (req, res) => {
  try {
    const result = await productService.deleteProduct(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message
    });
  }
};