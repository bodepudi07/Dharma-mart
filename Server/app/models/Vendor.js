import supabase from '../../supabase.js';

export const Vendor = {
  /**
   * Find vendors with potential filters
   * @param {object} criteria 
   * @returns {Promise<array>}
   */
  find: async (criteria = {}) => {
    let q = supabase
      .from('vendors')
      .select('*');

    if (criteria.status) q = q.eq('status', criteria.status);
    if (criteria.is_verified !== undefined) q = q.eq('is_verified', criteria.is_verified);

    const { data, error } = await q.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Find a vendor by ID
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  findById: async (id) => {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  /**
   * Find a vendor by slug
   * @param {string} slug 
   * @returns {Promise<object|null>}
   */
  findOne: async (criteria) => {
    let q = supabase.from('vendors').select('*');
    if (criteria.slug) q = q.eq('slug', criteria.slug);
    if (criteria.id) q = q.eq('id', criteria.id);
    if (criteria.email) q = q.eq('email', criteria.email);

    const { data, error } = await q.single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  /**
   * Create a new vendor
   * @param {object} vendorData 
   * @returns {Promise<object>}
   */
  create: async (vendorData) => {
    // Generate slug before inserting if not provided
    if (!vendorData.slug && vendorData.name) {
      vendorData.slug = vendorData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const { data, error } = await supabase
      .from('vendors')
      .insert([vendorData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a vendor
   * @param {string} id 
   * @param {object} updates 
   * @returns {Promise<object>}
   */
  findByIdAndUpdate: async (id, { $set: updates }) => {
    const { data, error } = await supabase
      .from('vendors')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a vendor
   * @param {string} id 
   */
  findByIdAndDelete: async (id) => {
    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export default Vendor;