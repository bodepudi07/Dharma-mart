import { Vendor } from '../models/index.js';
import { ApiError, asyncHandler } from '../middlewares/errorHandler.js';
import supabase from '../../supabase.js';

// Get all vendors
export const getVendors = asyncHandler(async (req, res) => {
  const vendors = await Vendor.find();
  res.json({
    success: true,
    data: vendors
  });
});

// Create/Update/Delete simplified for migration...
export const getVendor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const vendor = await Vendor.findOne({ id: id.match(/^[0-9a-fA-F-]{36}$/) ? id : undefined, slug: !id.match(/^[0-9a-fA-F-]{36}$/) ? id : undefined });
    if (!vendor) throw new ApiError(404, 'Vendor not found');
    res.json({ success: true, data: vendor });
});

export const createVendor = asyncHandler(async (req, res) => {
    const vendorData = req.body;
    const vendor = await Vendor.create(vendorData);
    res.status(201).json({ success: true, message: 'Vendor registered successfully', data: vendor });
});

export const updateVendor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { data: vendor, error } = await supabase.from('vendors').update(updates).eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, message: 'Vendor updated successfully', data: vendor });
});

// Vendor products logic
export const getVendorProducts = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const from = (parseInt(page) - 1) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    const { data: products, count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('vendor_id', id)
        .range(from, to);

    if (error) throw error;
    res.json({ success: true, data: products, total: count });
});

export const deleteVendor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await Vendor.findByIdAndDelete(id);
    res.json({ success: true, message: 'Vendor account deleted successfully' });
});

export const approveVendor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('vendors')
        .update({ status: 'approved', is_verified: true, approved_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    res.json({ success: true, message: 'Vendor approved successfully', data });
});

export const rejectVendor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const { data, error } = await supabase
        .from('vendors')
        .update({ status: 'rejected', notes: reason })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    res.json({ success: true, message: 'Vendor rejected successfully', data });
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