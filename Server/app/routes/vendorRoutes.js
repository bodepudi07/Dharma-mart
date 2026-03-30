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

const router = express.Router();

// Public routes
router.get('/', getVendors);
router.get('/:id', getVendor);
router.get('/:id/products', getVendorProducts);

// Admin routes (add authentication middleware as needed)
router.post('/', uploadVendorDocs, createVendor);
router.put('/:id', uploadVendorDocs, updateVendor);
router.delete('/:id', deleteVendor);
router.patch('/:id/approve', approveVendor);
router.patch('/:id/reject', rejectVendor);

export default router;