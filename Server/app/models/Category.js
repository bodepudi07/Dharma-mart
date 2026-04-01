import supabase from '../../supabase.js';

export const Category = {
  /**
   * Find categories with potential filters
   * @param {object} criteria 
   * @returns {Promise<array>}
   */
  find: async (criteria = {}) => {
    let q = supabase
      .from('categories')
      .select('*');

    if (criteria.is_active !== undefined) q = q.eq('is_active', criteria.is_active);
    if (criteria.parent_id !== undefined) q = (criteria.parent_id === null) ? q.is('parent_id', null) : q.eq('parent_id', criteria.parent_id);

    const { data, error } = await q.order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Find a category by ID
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  findById: async (id) => {
    const { data, error } = await supabase
      .from('categories')
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
   * Find a category by slug
   * @param {string} slug 
   * @returns {Promise<object|null>}
   */
  findOne: async (criteria) => {
    let q = supabase.from('categories').select('*');
    if (criteria.slug) q = q.eq('slug', criteria.slug);
    if (criteria.id) q = q.eq('id', criteria.id);

    const { data, error } = await q.single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  /**
   * Create a new category
   * @param {object} categoryData 
   * @returns {Promise<object>}
   */
  create: async (categoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update a category
   * @param {string} id 
   * @param {object} updates 
   * @returns {Promise<object>}
   */
  findByIdAndUpdate: async (id, { $set: updates }) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete a category
   * @param {string} id 
   */
  findByIdAndDelete: async (id) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

export default Category;