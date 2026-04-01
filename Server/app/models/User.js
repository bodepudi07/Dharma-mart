import supabase from '../../supabase.js';
import bcrypt from 'bcryptjs';

export const User = {
  /**
   * Find a user by email
   * @param {string} email 
   * @returns {Promise<object|null>}
   */
  findOne: async ({ email }) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    return data;
  },

  /**
   * Find a user by ID
   * @param {string} id 
   * @returns {Promise<object|null>}
   */
  findById: async (id) => {
    const { data, error } = await supabase
      .from('users')
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
   * Create a new user
   * @param {object} userData 
   * @returns {Promise<object>}
   */
  create: async (userData) => {
    const { name, email, password, role = 'user' } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password: hashedPassword,
        role
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Compare password candidate with hashed password
   * @param {string} candidatePassword 
   * @param {string} hashedPassword 
   * @returns {Promise<boolean>}
   */
  comparePassword: async (candidatePassword, hashedPassword) => {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
};

export default User;
