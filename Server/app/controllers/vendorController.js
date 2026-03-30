import { Vendor, Product } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../services/cloudinaryService.js';

// Get all vendors
export const getVendors = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    isVerified,
    search,
    sort = '-createdAt'
  } = req.query;

  const query = {};

  if (status && status !== 'all') {
    query.status = status;
  }

  if (isVerified === 'true') {
    query.isVerified = true;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const sortObj = {};
  const sortFields = sort.split(',');
  sortFields.forEach(field => {
    if (field.startsWith('-')) {
      sortObj[field.substring(1)] = -1;
    } else {
      sortObj[field] = 1;
    }
  });

  const [vendors, total] = await Promise.all([
    Vendor.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit)),
    Vendor.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: vendors,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// Get single vendor by ID or slug
export const getVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = id.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: id }
    : { slug: id };

  const vendor = await Vendor.findOne(query);

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  // Get vendor's products count
  const productsCount = await Product.countDocuments({ vendor: vendor._id });

  res.json({
    success: true,
    data: {
      ...vendor.toObject(),
      statistics: {
        ...vendor.statistics,
        totalProducts: productsCount
      }
    }
  });
});

// Create new vendor
export const createVendor = asyncHandler(async (req, res) => {
  const vendorData = req.body;

  // Check if vendor with same email exists
  const existingVendor = await Vendor.findOne({ email: vendorData.email });
  if (existingVendor) {
    throw new ApiError(400, 'Vendor with this email already exists');
  }

  // Handle logo upload
  if (req.files?.logo) {
    const uploadResult = await uploadToCloudinary(req.files.logo[0], 'dharma-mart/vendors');
    vendorData.logo = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };
  }

  // Handle banner upload
  if (req.files?.banner) {
    const uploadResult = await uploadToCloudinary(req.files.banner[0], 'dharma-mart/vendors');
    vendorData.banner = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };
  }

  const vendor = await Vendor.create(vendorData);

  res.status(201).json({
    success: true,
    message: 'Vendor created successfully',
    data: vendor
  });
});

// Update vendor
export const updateVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  // Check if email is being changed and if it's unique
  if (updates.email && updates.email !== vendor.email) {
    const existingVendor = await Vendor.findOne({
      email: updates.email,
      _id: { $ne: id }
    });
    if (existingVendor) {
      throw new ApiError(400, 'Vendor with this email already exists');
    }
  }

  // Handle logo upload
  if (req.files?.logo) {
    if (vendor.logo?.publicId) {
      await deleteFromCloudinary(vendor.logo.publicId);
    }
    const uploadResult = await uploadToCloudinary(req.files.logo[0], 'dharma-mart/vendors');
    updates.logo = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };
  }

  // Handle banner upload
  if (req.files?.banner) {
    if (vendor.banner?.publicId) {
      await deleteFromCloudinary(vendor.banner.publicId);
    }
    const uploadResult = await uploadToCloudinary(req.files.banner[0], 'dharma-mart/vendors');
    updates.banner = {
      url: uploadResult.url,
      publicId: uploadResult.publicId
    };
  }

  const updatedVendor = await Vendor.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    message: 'Vendor updated successfully',
    data: updatedVendor
  });
});

// Delete vendor
export const deleteVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  // Check if vendor has products
  const productsCount = await Product.countDocuments({ vendor: id });
  if (productsCount > 0) {
    throw new ApiError(400, 'Cannot delete vendor with existing products. Remove products first.');
  }

  // Delete images from Cloudinary
  if (vendor.logo?.publicId) {
    await deleteFromCloudinary(vendor.logo.publicId);
  }
  if (vendor.banner?.publicId) {
    await deleteFromCloudinary(vendor.banner.publicId);
  }

  await Vendor.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'Vendor deleted successfully'
  });
});

// Approve vendor
export const approveVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  vendor.status = 'approved';
  vendor.isVerified = true;
  vendor.approvedAt = new Date();
  vendor.approvedBy = req.user?.id;

  await vendor.save();

  res.json({
    success: true,
    message: 'Vendor approved successfully',
    data: vendor
  });
});

// Reject vendor
export const rejectVendor = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  vendor.status = 'rejected';
  vendor.notes = reason;

  await vendor.save();

  res.json({
    success: true,
    message: 'Vendor rejected',
    data: vendor
  });
});

// Get vendor products
export const getVendorProducts = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20, status } = req.query;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  const query = { vendor: id };
  if (status && status !== 'all') {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
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

export default {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  approveVendor,
  rejectVendor,
  getVendorProducts
};