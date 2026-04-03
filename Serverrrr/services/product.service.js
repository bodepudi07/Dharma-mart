// services/product.service.js

import mongoose from "mongoose";
import Product from "../models/product.model.js";
import cloudinary from "../utils/cloudinary.js";

// CREATE
export const createProduct = async (data) => {
  return await Product.create(data);
};

// GET ALL
export const getAllProducts = async (query) => {
  const {
    page = 1,
    limit = 10,
    categoryId,
    search,
    minPrice,
    maxPrice
  } = query;

  const pageNum = Number(page);
  const limitNum = Number(limit);

  const filter = { isActive: true };

  if (categoryId) filter.categoryId = categoryId;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (pageNum - 1) * limitNum;

  const products = await Product.find(filter)
    .populate("categoryId", "name slug")
    .skip(skip)
    .limit(limitNum)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments(filter);

  return {
    products,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum)
  };
};

// GET ONE
export const getProductById = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findOne({
    _id: id,
    isActive: true
  }).populate("categoryId", "name slug fields");

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
};

// UPDATE
export const updateProduct = async (id, data) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new Error("Product not found");
  }

  // ✅ delete old images if replacing
  if (data.images && product.images.length > 0) {
    await Promise.all(
      product.images.map(img =>
        cloudinary.uploader.destroy(img.public_id)
      )
    );
  }

  Object.assign(product, data);

  await product.save();

  return product;
};

// DELETE (soft delete + cloudinary cleanup)
export const deleteProduct = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(id);

  if (!product) {
    throw new Error("Product not found");
  }

  if (product.images.length > 0) {
    await Promise.all(
      product.images.map(img =>
        cloudinary.uploader.destroy(img.public_id)
      )
    );
  }

  product.isActive = false;
  await product.save();

  return { message: "Product deleted successfully" };
};