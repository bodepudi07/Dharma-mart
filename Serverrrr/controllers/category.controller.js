// controllers/category.controller.js

import * as categoryService from "../services/category.service.js";
import cache from "../utils/cache.js";

//  CREATE
export const create = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    cache.flushAll(); // Clear cache after creating a new category
    res.status(201).json({
      success: true,
      data: category
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

    const cacheKey = JSON.stringify(req.query);

    const cachedData = cache.get(cacheKey);
    if (cachedData) {      
      return res.status(200).json({
        success: true,
        data: cachedData
      });
    }

    const categories = await categoryService.getAllCategories();

    cache.set(cacheKey, categories);

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


//  GET ONE
export const getOne = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    res.status(404).json({
      success: false,
      message: err.message
    });
  }
};

//  UPDATE
export const update = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(
      req.params.id,
      req.body
    );

    cache.flushAll(); // Clear cache after updating a category

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

//  DELETE
export const remove = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);

    cache.flushAll(); // Clear cache after deleting a category

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