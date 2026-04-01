import supabase from '../../supabase.js';

export const Order = {
  /**
   * Find orders based on criteria
   * @param {object} criteria 
   * @returns {object} - Supabase query
   */
  find: (criteria = {}) => {
    let q = supabase
      .from('orders')
      .select('*, order_items(*, product_id(*)), user_id(name, email)');

    if (criteria.user) q = q.eq('user_id', criteria.user);
    if (criteria.status) q = q.eq('status', criteria.status);
    if (criteria.payment && criteria.payment.status) q = q.eq('payment_status', criteria.payment.status);
    if (criteria.payment && criteria.payment.cashfreeOrderId) q = q.eq('cashfree_order_id', criteria.payment.cashfreeOrderId);

    return q;
  },

  /**
   * Find a single order
   * @param {object} criteria 
   * @returns {Promise<object|null>}
   */
  findOne: async (criteria) => {
    let q = supabase
      .from('orders')
      .select('*, order_items(*, product_id(*), vendor_id(*)), user_id(name, email)');

    if (criteria._id) q = q.eq('id', criteria._id);
    else if (criteria.orderNumber) q = q.eq('order_number', criteria.orderNumber);
    else if (criteria['payment.cashfreeOrderId']) q = q.eq('cashfree_order_id', criteria['payment.cashfreeOrderId']);

    const { data, error } = await q.single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    // Map fields back to Mongoose-like structure if needed for controller compatibility
    if (data && data.order_items) {
      data.items = data.order_items.map(item => ({
        product: item.product_id,
        vendor: item.vendor_id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.total_price,
        image: { url: item.image_url, publicId: item.image_public_id },
        variant: item.variant
      }));
      delete data.order_items;
    }

    return data;
  },

  /**
   * Find by ID
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  findById: async (id) => {
    return await Order.findOne({ _id: id });
  },

  /**
   * Create a new order
   * @param {object} orderData 
   * @returns {Promise<object>}
   */
  create: async (orderData) => {
    const { items = [], shippingAddress, payment, ...rest } = orderData;
    
    // Map data to flat SQL structure
    const dbOrder = {
      order_number: rest.orderNumber,
      user_id: rest.user,
      guest_email: rest.guestEmail,
      shipping_full_name: shippingAddress.fullName,
      shipping_phone: shippingAddress.phone,
      shipping_email: shippingAddress.email,
      shipping_street: shippingAddress.street,
      shipping_city: shippingAddress.city,
      shipping_state: shippingAddress.state,
      shipping_country: shippingAddress.country,
      shipping_zip_code: shippingAddress.zipCode,
      shipping_landmark: shippingAddress.landmark,
      shipping_address_type: shippingAddress.addressType || 'home',
      payment_method: payment.method,
      payment_status: payment.status || 'pending',
      payment_amount: payment.amount,
      payment_currency: payment.currency || 'INR',
      subtotal: rest.subtotal,
      tax_amount: rest.taxAmount || 0,
      shipping_cost: rest.shippingCost || 0,
      discount_amount: rest.discount?.amount || 0,
      total_amount: rest.totalAmount,
      status: rest.status || 'pending',
      customer_note: rest.notes,
      ip_address: rest.metadata?.ipAddress,
      user_agent: rest.metadata?.userAgent
    };

    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert([dbOrder])
        .select()
        .single();

      if (error) {
        console.error('Database Error (Order):', error);
        throw error;
      }

      // Insert line items
      if (items.length > 0) {
        const itemsToInsert = items.map(item => ({
          order_id: order.id,
          product_id: item.product,
          vendor_id: item.vendor,
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          price: item.price,
          total_price: item.totalPrice,
          image_url: item.image?.url,
          image_public_id: item.image?.publicId,
          variant: item.variant
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(itemsToInsert);
        
        if (itemsError) {
          console.error('Database Error (Items):', itemsError);
          // In a real app, you might want to roll back the order here
          throw itemsError;
        }
      }

      return await Order.findById(order.id);
    } catch (err) {
      console.error('Failed to create order in Supabase:', err);
      throw err;
    }
  },

  /**
   * Count documents
   * @param {object} query 
   * @returns {Promise<number>}
   */
  countDocuments: async (query = {}) => {
    let q = supabase.from('orders').select('*', { count: 'exact', head: true });
    if (query.user) q = q.eq('user_id', query.user);
    if (query.status) q = q.eq('status', query.status);

    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  }
};

export default Order;