import { Category } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';

// Get all categories
export const getCategories = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    parentOnly = false,
    includeInactive = false,
    search 
  } = req.query;

  const query = {};
  
  if (parentOnly === 'true') {
    query.parentCategory = null;
  }
  
  if (includeInactive !== 'true') {
    query.isActive = true;
  }
  
  if (search) {
    query.name = { $regex: search, $options: 'i' };
  }

  const pg = parseInt(page) || 1;
  const lim = parseInt(limit) || 50;
  const skip = (pg - 1) * lim;
  
  const [categories, total] = await Promise.all([
    Category.find(query)
      .populate('parentCategory', 'name slug')
      .sort({ sortOrder: 1, name: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Category.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: categories,
    pagination: {
      page: pg,
      limit: lim,
      total,
      pages: Math.ceil(total / lim)
    }
  });
});

// Get category by ID or slug
export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const query = id.match(/^[0-9a-fA-F]{24}$/) 
    ? { _id: id } 
    : { slug: id };

  const category = await Category.findOne(query)
    .populate('parentCategory', 'name slug')
    .populate({
      path: 'customFields',
      select: 'name type required options'
    });

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  res.json({
    success: true,
    data: category
  });
});

// Create new category
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, parentCategory, customFields, isActive, sortOrder } = req.body;

  // Check if category with same name exists
  const existingCategory = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
  if (existingCategory) {
    throw new ApiError(400, 'Category with this name already exists');
  }

  const categoryData = {
    name,
    description,
    parentCategory: parentCategory || null,
    customFields: customFields || [],
    isActive: isActive !== undefined ? isActive : true,
    sortOrder: sortOrder || 0
  };

  // Handle image upload
  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file, 'dharma-mart/categories');
    categoryData.image = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };
  }

  const category = await Category.create(categoryData);
  
  const populatedCategory = await Category.findById(category._id)
    .populate('parentCategory', 'name slug');

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: populatedCategory
  });
});

// Update category
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Check if name is being changed and if it's unique
  if (updates.name && updates.name !== category.name) {
    const existingCategory = await Category.findOne({ 
      name: { $regex: `^${updates.name}$`, $options: 'i' },
      _id: { $ne: id }
    });
    if (existingCategory) {
      throw new ApiError(400, 'Category with this name already exists');
    }
  }

  // Handle image upload
  if (req.file) {
    // Delete old image if exists
    if (category.image?.publicId) {
      await deleteFromCloudinary(category.image.publicId);
    }
    
    const uploadResult = await uploadToCloudinary(req.file, 'dharma-mart/categories');
    updates.image = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  ).populate('parentCategory', 'name slug');

  res.json({
    success: true,
    message: 'Category updated successfully',
    data: updatedCategory
  });
});

// Delete category
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Check if category has subcategories
  const subcategories = await Category.countDocuments({ parentCategory: id });
  if (subcategories > 0) {
    throw new ApiError(400, 'Cannot delete category with subcategories. Delete subcategories first.');
  }

  // Delete image from Cloudinary
  if (category.image?.publicId) {
    await deleteFromCloudinary(category.image.publicId);
  }

  await Category.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// Get category tree
export const getCategoryTree = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 });

  const buildTree = (parentId = null) => {
    return categories
      .filter(cat => {
        const catParentId = cat.parentCategory ? cat.parentCategory.toString() : null;
        return catParentId === parentId;
      })
      .map(cat => ({
        _id: cat._id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        customFields: cat.customFields,
        children: buildTree(cat._id.toString())
      }));
  };

  const tree = buildTree();

  res.json({
    success: true,
    data: tree
  });
});

export default {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree
};