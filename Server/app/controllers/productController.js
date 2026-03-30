import { Product, Category, Vendor } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';

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
    sort = '-createdAt',
    tags
  } = req.query;

  const query = {};

  // Status filter
  if (status && status !== 'all') {
    query.status = status;
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Vendor filter
  if (vendor) {
    query.vendor = vendor;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  // Boolean filters
  if (isFeatured === 'true') query.isFeatured = true;
  if (isNewArrival === 'true') query.isNewArrival = true;
  if (isBestSeller === 'true') query.isBestSeller = true;

  // Tags filter
  if (tags) {
    query.tags = { $in: tags.split(',').map(t => t.trim()) };
  }

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Parse sort string
  const sortObj = {};
  const sortFields = sort.split(',');
  sortFields.forEach(field => {
    if (field.startsWith('-')) {
      sortObj[field.substring(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  });

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .populate('vendor', 'name slug logo')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit)),
    Product.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: products,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Get single product by ID or slug
export const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = id.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: id }
    : { slug: id };

  const product = await Product.findOne(query)
    .populate('category', 'name slug customFields')
    .populate('vendor', 'name slug logo address ratings')
    .populate('relatedProducts', 'name slug price images thumbnail');

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  res.json({
    success: true,
    data: product
  });
});

// Create new product
export const createProduct = asyncHandler(async (req, res) => {
  const productData = req.body;

  // Sanitize ObjectId fields (convert empty strings to null)
  const objectIdFields = ['vendor', 'subcategory', 'category'];
  objectIdFields.forEach(field => {
    if (productData[field] === '') {
      productData[field] = null;
    }
  });

  // Verify category exists
  const category = await Category.findById(productData.category);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Verify vendor exists if provided
  if (productData.vendor) {
    const vendor = await Vendor.findById(productData.vendor);
    if (!vendor) {
      throw new ApiError(404, 'Vendor not found');
    }
  }

  // Handle main image upload
  if (req.files?.mainImage) {
    const uploadResult = await uploadToCloudinary(req.files.mainImage[0], 'dharma-mart/products');
    productData.thumbnail = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };
    productData.images = [{
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      isPrimary: true
    }];
  }

  // Handle gallery images upload
  if (req.files?.gallery) {
    const galleryResults = await Promise.all(
      req.files.gallery.map(file => uploadToCloudinary(file, 'dharma-mart/products'))
    );
    
    const galleryImages = galleryResults.map((result, index) => ({
      url: result.url,
      publicId: result.publicId,
      isPrimary: index === 0 && !productData.thumbnail
    }));

    if (productData.images) {
      productData.images = [...productData.images, ...galleryImages];
    } else {
      productData.images = galleryImages;
    }

    // Set thumbnail to first gallery image if not set
    if (!productData.thumbnail && galleryImages.length > 0) {
      productData.thumbnail = {
        url: galleryImages[0].url,
        publicId: galleryImages[0].publicId
      };
    }
  }

  const product = await Product.create(productData);

  const populatedProduct = await Product.findById(product._id)
    .populate('category', 'name slug')
    .populate('vendor', 'name slug');

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    data: populatedProduct
  });
});

// Update product
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Sanitize ObjectId fields (convert empty strings to null)
  const objectIdFields = ['vendor', 'subcategory', 'category'];
  objectIdFields.forEach(field => {
    if (updates[field] === '') {
      updates[field] = null;
    }
  });

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Verify category if being updated
  if (updates.category) {
    const category = await Category.findById(updates.category);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
  }

  // Verify vendor if being updated
  if (updates.vendor) {
    const vendor = await Vendor.findById(updates.vendor);
    if (!vendor) {
      throw new ApiError(404, 'Vendor not found');
    }
  }

  // Handle main image upload
  if (req.files?.mainImage) {
    // Delete old thumbnail
    if (product.thumbnail?.publicId) {
      await deleteFromCloudinary(product.thumbnail.publicId);
    }

    const uploadResult = await uploadToCloudinary(req.files.mainImage[0], 'dharma-mart/products');
    updates.thumbnail = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };
  }

  // Handle gallery images upload
  if (req.files?.gallery) {
    const galleryResults = await Promise.all(
      req.files.gallery.map(file => uploadToCloudinary(file, 'dharma-mart/products'))
    );
    
    const galleryImages = galleryResults.map(result => ({
      url: result.url,
      publicId: result.publicId,
      isPrimary: false
    }));

    updates.images = [...(product.images || []), ...galleryImages];
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate('category', 'name slug')
    .populate('vendor', 'name slug');

  res.json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct
  });
});

// Delete product
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Delete images from Cloudinary
  if (product.thumbnail?.publicId) {
    await deleteFromCloudinary(product.thumbnail.publicId);
  }

  if (product.images && product.images.length > 0) {
    await Promise.all(
      product.images.map(img => 
        img.publicId ? deleteFromCloudinary(img.publicId) : Promise.resolve()
      )
    );
  }

  await Product.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Get featured products
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ 
    isFeatured: true, 
    status: 'active' 
  })
    .populate('category', 'name slug')
    .populate('vendor', 'name slug logo')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: products
  });
});

// Get new arrivals
export const getNewArrivals = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ 
    isNewArrival: true, 
    status: 'active' 
  })
    .populate('category', 'name slug')
    .populate('vendor', 'name slug logo')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: products
  });
});

// Get best sellers
export const getBestSellers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const products = await Product.find({ 
    isBestSeller: true, 
    status: 'active' 
  })
    .populate('category', 'name slug')
    .populate('vendor', 'name slug logo')
    .sort({ 'ratings.average': -1 })
    .limit(parseInt(limit));

  res.json({
    success: true,
    data: products
  });
});

// Add product review
export const addProductReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user?.id;

  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Check if user already reviewed
  const existingReview = product.reviews.find(
    r => r.user.toString() === userId
  );

  if (existingReview) {
    throw new ApiError(400, 'You have already reviewed this product');
  }

  product.reviews.push({
    user: userId,
    rating,
    comment
  });

  // Update average rating
  const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  product.ratings.average = totalRating / product.reviews.length;
  product.ratings.count = product.reviews.length;

  await product.save();

  res.json({
    success: true,
    message: 'Review added successfully'
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