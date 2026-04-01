import { Category } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';
import { getOrSet, invalidatePattern } from '../utils/cache.js';

// Get all categories
export const getCategories = asyncHandler(async (req, res) => {
  const { status = 'active', parentId } = req.query;
  const cacheKey = `categories:${status}:${parentId || 'root'}`;
  const TTL = process.env.CACHE_TTL_CATEGORIES ? parseInt(process.env.CACHE_TTL_CATEGORIES) : 300;

  const categories = await getOrSet(cacheKey, async () => {
    return await Category.find({ is_active: status === 'active', parent_id: parentId });
  }, TTL);

  res.json({
    success: true,
    data: categories
  });
});

// Get single category by ID or slug
export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findOne({ id: id.match(/^[0-9a-fA-F-]{36}$/) ? id : undefined, slug: !id.match(/^[0-9a-fA-F-]{36}$/) ? id : undefined });

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
  invalidatePattern('categories:');
  const categoryData = req.body;
  const category = await Category.create(categoryData);
  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    data: category
  });
});

// Update category
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  invalidatePattern('categories:');
  
  const category = await Category.findByIdAndUpdate(id, { $set: updates });
  if (!category) throw new ApiError(404, 'Category not found');
  
  res.json({
    success: true,
    data: category
  });
});

// Delete category
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  invalidatePattern('categories:');
  
  // Check if it has subcategories (optional logic can be added)
  await Category.findByIdAndDelete(id);
  
  res.json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// Get category tree (nested)
export const getCategoryTree = asyncHandler(async (req, res) => {
  const allCategories = await Category.find({ is_active: true });
  
  // Build tree logic
  const buildTree = (parentId = null) => {
    return allCategories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat,
        children: buildTree(cat.id)
      }));
  };

  const tree = buildTree(null);
  
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