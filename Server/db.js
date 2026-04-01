import supabase from './supabase.js'

const testConnection = async () => {
  const { error } = await supabase.from('users').select('id').limit(1)
  if (error && error.code !== 'PGRST116') {
    // PGRST116 = "no rows" which is fine
    throw error
  }
}

export default testConnection