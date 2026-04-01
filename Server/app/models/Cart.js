import supabase from '../../supabase.js';

export const Cart = {
  /**
   * Find a cart by user ID or session ID
   * @param {object} criteria 
   * @returns {Promise<object|null>}
   */
  findOne: async (criteria) => {
    let q = supabase
      .from('carts')
      .select('*, cart_items(*, product_id(*))');

    if (criteria.user) q = q.eq('user_id', criteria.user);
    if (criteria.sessionId) q = q.eq('session_id', criteria.sessionId);
    if (criteria.isActive !== undefined) q = q.eq('is_active', criteria.isActive);

    const { data, error } = await q.single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Transform Supabase structure to match Mongoose format simplified for controller
    if (data) {
      data.totalItems = data.total_items;
      if (data.cart_items) {
        data.items = data.cart_items.map(item => ({
          product: item.product_id,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant,
          addedAt: item.added_at
        }));
        delete data.cart_items;
      }
    }

    return data;
  },

  /**
   * Create a new cart
   * @param {object} cartData 
   * @returns {Promise<object>}
   */
  create: async (cartData) => {
      const { user, sessionId, items = [] } = cartData;
      
      const { data: cart, error: cartError } = await supabase
          .from('carts')
          .insert([{ user_id: user, session_id: sessionId }])
          .select()
          .single();
      
      if (cartError) throw cartError;

      if (items.length > 0) {
          const itemsToInsert = items.map(item => ({
              cart_id: cart.id,
              product_id: item.product,
              quantity: item.quantity,
              price: item.price,
              variant: item.variant
          }));

          await supabase.from('cart_items').insert(itemsToInsert);
      }

      return cart;
  },

  /**
   * Update a cart using findOneAndUpdate pattern
   */
  findOneAndUpdate: async (criteria, { $set: updates }, { upsert = false, new: isNew = true } = {}) => {
      let cart = await Cart.findOne(criteria);
      
      if (!cart && upsert) {
          cart = await Cart.create({ ...criteria, ...updates });
          return cart;
      }
      
      if (!cart) return null;

      const updates_obj = updates.$set || updates;
      const { items, ...rest } = updates_obj;

      if (rest && Object.keys(rest).length > 0) {
          const { error } = await supabase
              .from('carts')
              .update(rest)
              .eq('id', cart.id);
          if (error) throw error;
      }

      if (items) {
          // Clear and replace items for simplicity in migration
          await supabase.from('cart_items').delete().eq('cart_id', cart.id);
          
          if (items.length > 0) {
              const itemsToInsert = items.map(item => ({
                  cart_id: cart.id,
                  product_id: item.product.id || item.product,
                  quantity: item.quantity,
                  price: item.price,
                  variant: item.variant
              }));
              await supabase.from('cart_items').insert(itemsToInsert);
          }
      }

      return await Cart.findOne({ id: cart.id });
  },

  /**
   * Find by ID
   */
  findById: async (id) => {
      return await Cart.findOne({ id });
  }
};

export default Cart;