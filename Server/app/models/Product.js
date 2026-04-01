import supabase from '../../supabase.js';

export const Product = {
  /**
   * Find query with pagination and filters
   * @param {object} query - Filter options
   * @returns {object} - Supabase query object
   */
  find: (query = {}) => {
    let q = supabase
      .from('products')
      .select('*, category_id(name, slug), vendor_id(name, slug, logo_url)');

    // Apply filters (simplified for migration, can be extended in controller)
    if (query.status) q = q.eq('status', query.status);
    if (query.category_id) q = q.eq('category_id', query.category_id);
    if (query.vendor_id) q = q.eq('vendor_id', query.vendor_id);
    if (query.is_featured) q = q.eq('is_featured', query.is_featured);
    if (query.is_new_arrival) q = q.eq('is_new_arrival', query.is_new_arrival);
    if (query.is_best_seller) q = q.eq('is_best_seller', query.is_best_seller);

    // Return the query object for further chaining in controller
    return q;
  },

  /**
   * Find one product by ID or custom field
   * @param {object} criteria 
   * @returns {Promise<object|null>}
   */
  findOne: async (criteria) => {
    let q = supabase
      .from('products')
      .select('*, category_id(name, slug), vendor_id(name, slug, logo_url, ratings_average, ratings_count)');

    if (criteria._id) q = q.eq('id', criteria._id);
    else if (criteria.slug) q = q.eq('slug', criteria.slug);

    const { data, error } = await q.single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Fetch primary images and gallery
    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', data.id)
      .order('sort_order', { ascending: true });

    data.images = images || [];
    return data;
  },

  /**
   * Find product by ID
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  findById: async (id) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, category_id(name, slug), vendor_id(name, slug)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  /**
   * Create a new product
   * @param {object} productData 
   * @returns {Promise<object>}
   */
  create: async (productData) => {
    const { images = [], ...rest } = productData;
    
    // Insert product
    const { data: product, error: productError } = await supabase
        .from('products')
        .insert([rest])
        .select()
        .single();

    if (productError) throw productError;

    // Insert images if any
    if (images.length > 0) {
      const imagesToInsert = images.map((img, index) => ({
        product_id: product.id,
        url: img.url,
        public_id: img.publicId,
        alt: img.alt,
        is_primary: img.isPrimary || index === 0,
        sort_order: index
      }));

      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imagesToInsert);
      
      if (imageError) throw imageError;
      product.images = imagesToInsert;
    }

    return product;
  },

  /**
   * Update a product
   * @param {string} id 
   * @param {object} updates 
   * @returns {Promise<object>}
   */
  findByIdAndUpdate: async (id, { $set: updates }, { new: isNew = true } = {}) => {
      const { images, ...rest } = updates;
      
      const { data, error } = await supabase
          .from('products')
          .update(rest)
          .eq('id', id)
          .select()
          .single();
      
      if (error) throw error;
      
      if (images) {
          // Simplified: delete old and insert new, or just handle gallery updates
          // For now, let's keep it simple as base migration
      }

      return data;
  },

  /**
   * Delete a product
   * @param {string} id 
   */
  findByIdAndDelete: async (id) => {
      const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
      if (error) throw error;
  },

  /**
   * Count documents matching a query
   * @param {object} query 
   * @returns {Promise<number>}
   */
  countDocuments: async (query = {}) => {
    let q = supabase.from('products').select('*', { count: 'exact', head: true });
    
    if (query.status) q = q.eq('status', query.status);
    if (query.category_id) q = q.eq('category_id', query.category_id);
    if (query.vendor_id) q = q.eq('vendor_id', query.vendor_id);

    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  }
};

export default Product;