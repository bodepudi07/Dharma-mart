import express from 'express';
import {
  getVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  approveVendor,
  rejectVendor,
  getVendorProducts
} from '../controllers/vendorController.js';
import { uploadVendorDocs } from '../middlewares/upload.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getVendors);
router.get('/:id', getVendor);
router.get('/:id/products', getVendorProducts);

// Admin routes
router.post('/', uploadVendorDocs, createVendor); // Registration can be public? Or protected by store admin.
router.put('/:id', protect, authorize('admin', 'vendor'), uploadVendorDocs, updateVendor);
router.delete('/:id', protect, authorize('admin'), deleteVendor);
router.patch('/:id/approve', protect, authorize('admin'), approveVendor);
router.patch('/:id/reject', protect, authorize('admin'), rejectVendor);

export default router;