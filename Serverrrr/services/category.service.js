// services/category.service.js

import Category from "../models/category.model.js";

//  CREATE
export const createCategory = async (data) => {
  const category = await Category.create(data);
  return category;
};

//  GET ALL
export const getAllCategories = async () => {
  return Category.find().sort({ createdAt: -1 });
};

// GET ONE
export const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    throw new Error("Category not found");
  }
  return category;
};

//  UPDATE
export const updateCategory = async (id, data) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  Object.assign(category, data);

  await category.save();

  return category;
};

//  DELETE
export const deleteCategory = async (id) => {
  const category = await Category.findById(id);

  if (!category) {
    throw new Error("Category not found");
  }

  await category.deleteOne();

  return { message: "Category deleted successfully" };
};