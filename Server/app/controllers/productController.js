import { Product, Category, Vendor } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';
import { getOrSet, invalidatePattern } from '../utils/cache.js';

// Get all products with filtering, sorting, and pagination
export const getProducts = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    vendor,
    minPrice,
    maxPrice,
    status = 'active',
    isFeatured,
    isNewArrival,
    isBestSeller,
    search,
    sort = 'created_at.desc',
    tags
  } = req.query;

  // Use a cache key based on all query parameters
  const cacheKey = `products:${JSON.stringify(req.query)}`;
  const TTL = process.env.CACHE_TTL_PRODUCTS ? parseInt(process.env.CACHE_TTL_PRODUCTS) : 60;

  const result = await getOrSet(cacheKey, async () => {
    let q = Product.find();

    // Filters
    if (status && status !== 'all') q = q.eq('status', status);
    if (category) q = q.eq('category_id', category);
    if (vendor) q = q.eq('vendor_id', vendor);
    if (isFeatured === 'true') q = q.eq('is_featured', true);
    if (isNewArrival === 'true') q = q.eq('is_new_arrival', true);
    if (isBestSeller === 'true') q = q.eq('is_best_seller', true);
    
    if (minPrice) q = q.gte('price', parseFloat(minPrice));
    if (maxPrice) q = q.lte('price', parseFloat(maxPrice));

    if (search) {
      q = q.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Pagination
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    // Sorting
    const [sortCol, sortDir] = sort.includes('.') ? sort.split('.') : ['created_at', 'desc'];
    q = q.order(sortCol, { ascending: sortDir === 'asc' });

    const { data: products, count, error } = await q.range(from, to).select('*, category_id(name, slug), vendor_id(name, slug, logo_url)', { count: 'exact' });

    if (error) throw error;

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit))
      }
    };
  }, TTL);

  res.json({
    success: true,
    data: result.products,
    pagination: result.pagination
  });
});

// Get single product by ID or slug
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cacheKey = `product:${id}`;
  const TTL = process.env.CACHE_TTL_PRODUCTS ? parseInt(process.env.CACHE_TTL_PRODUCTS) : 60;

  const product = await getOrSet(cacheKey, async () => {
    const p = await Product.findOne(id.match(/^[0-9a-fA-F-]{36}$/) ? { _id: id } : { slug: id });
    if (!p) throw new ApiError(404, 'Product not found');
    return p;
  }, TTL);

  res.json({
    success: true,
    data: product
  });
});

// Create new product
export const createProduct = asyncHandler(async (req, res) => {
  const productData = { ...req.body };
  
  // Clean empty UUIDs and empty numbers
  if (!productData.vendor_id) delete productData.vendor_id;
  if (!productData.category_id) delete productData.category_id;
  if (productData.compare_price === '') productData.compare_price = null;
  
  // Parse tags to array
  if (productData.tags && typeof productData.tags === 'string') {
    productData.tags = productData.tags.split(',').map(t => t.trim()).filter(Boolean);
  }
  
  // Parse boolean strings
  ['is_featured', 'is_new_arrival', 'is_best_seller', 'track_inventory'].forEach(key => {
    if (productData[key] === 'true') productData[key] = true;
    if (productData[key] === 'false') productData[key] = false;
  });

  // Invalidate cache
  invalidatePattern('products:');

  // Verify category/vendor (already handles ObjectIds, adapt for Supabase UUIDs)
  const category = await Category.findById(productData.category_id || productData.category);
  if (!category) throw new ApiError(404, 'Category not found');

  if (productData.vendor_id || productData.vendor) {
    const vendor = await Vendor.findById(productData.vendor_id || productData.vendor);
    if (!vendor) throw new ApiError(404, 'Vendor not found');
  }

  // Handle main image upload
  if (req.files?.mainImage) {
      const uploadResult = await uploadToCloudinary(req.files.mainImage[0], 'dharma-mart/products');
      productData.thumbnail_url = uploadResult.url;
      productData.thumbnail_public_id = uploadResult.publicId;
      productData.images = [{ url: uploadResult.url, publicId: uploadResult.publicId, isPrimary: true }];
  }

  // Handle gallery upload (max 2 images)
  if (req.files?.gallery) {
      const galleryFiles = req.files.gallery.slice(0, 2);
      const uploadResults = await Promise.all(
          galleryFiles.map(file => uploadToCloudinary(file, 'dharma-mart/products'))
      );
      
      const galleryImages = uploadResults.map(res => ({
          url: res.url,
          publicId: res.publicId,
          isPrimary: false
      }));
      
      productData.images = [...(productData.images || []), ...galleryImages];
  }

  const product = await Product.create(productData);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: product
  });
});

// Update/Delete (Already conceptually logic-ready above)
export const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    invalidatePattern('products:');
    invalidatePattern(`product:${id}`);
    
    const updates = { ...req.body };
    
    // Clean empty UUIDs and numbers
    if (updates.vendor_id === '') updates.vendor_id = null;
    if (updates.category_id === '') updates.category_id = null;
    if (updates.compare_price === '') updates.compare_price = null;
    
    // Parse tags to array
    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    
    // Parse boolean strings
    ['is_featured', 'is_new_arrival', 'is_best_seller', 'track_inventory'].forEach(key => {
      if (updates[key] === 'true') updates[key] = true;
      if (updates[key] === 'false') updates[key] = false;
    });

    // Handle gallery update (max 2 images)
    if (req.files?.gallery) {
        const galleryFiles = req.files.gallery.slice(0, 2);
        const uploadResults = await Promise.all(
            galleryFiles.map(file => uploadToCloudinary(file, 'dharma-mart/products'))
        );
        
        const galleryImages = uploadResults.map(res => ({
            url: res.url,
            publicId: res.publicId,
            isPrimary: false
        }));
        
        updates.images = [...(updates.images || []), ...galleryImages];
    }

    const product = await Product.findByIdAndUpdate(id, { $set: updates });
    res.json({
        success: true,
        data: product
    });
});

export const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    invalidatePattern('products:');
    invalidatePattern(`product:${id}`);
    await Product.findByIdAndDelete(id);
    res.json({ success: true, message: 'Product deleted' });
});

// Featured, New Arrivals, Best Sellers using getOrSet
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const result = await getOrSet('products:featured', async () => {
    const { data, error } = await Product.find().eq('is_featured', true).eq('status', 'active').limit(parseInt(limit));
    if (error) throw error;
    return data;
  }, 120);
  res.json({ success: true, data: result });
});

export const getNewArrivals = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const result = await getOrSet('products:new-arrivals', async () => {
    const { data, error } = await Product.find().eq('is_new_arrival', true).eq('status', 'active').limit(parseInt(limit));
    if (error) throw error;
    return data;
  }, 120);
  res.json({ success: true, data: result });
});

export const getBestSellers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  const result = await getOrSet('products:best-sellers', async () => {
    const { data, error } = await Product.find().eq('is_best_seller', true).eq('status', 'active').limit(parseInt(limit));
    if (error) throw error;
    return data;
  }, 120);
  res.json({ success: true, data: result });
});

// Add product review
export const addProductReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const { data, error } = await supabase
    .from('product_reviews')
    .insert([{
      product_id: id,
      user_id: userId,
      rating: parseInt(rating),
      comment
    }])
    .select()
    .single();

  if (error) throw error;

  // Invalidate product cache to reflect new rating if we added rating aggregation logic later
  invalidatePattern(`product:${id}`);

  res.status(201).json({
    success: true,
    data
  });
});

export default {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  addProductReview
};