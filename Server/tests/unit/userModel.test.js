import User from '../../app/models/User.js';
import supabase from '../../supabase.js';

// Use the manual mock
jest.mock('../../supabase.js');

describe('User Model Unit Test (Supabase)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should find a user by email', async () => {
    const mockUser = { id: 'uuid-123', email: 'test@example.com' };
    supabase.single.mockResolvedValueOnce({ data: mockUser, error: null });

    const user = await User.findOne({ email: 'test@example.com' });

    expect(supabase.from).toHaveBeenCalledWith('users');
    expect(supabase.eq).toHaveBeenCalledWith('email', 'test@example.com');
    expect(user).toEqual(mockUser);
  });

  it('should return null if user not found', async () => {
    supabase.single.mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

    const user = await User.findOne({ email: 'nonexistent@example.com' });

    expect(user).toBeNull();
  });

  it('should create a new user with hashed password', async () => {
    const mockUser = { id: 'uuid-456', email: 'new@example.com' };
    supabase.single.mockResolvedValueOnce({ data: mockUser, error: null });

    const user = await User.create({
      name: 'New User',
      email: 'new@example.com',
      password: 'password123'
    });

    expect(supabase.from).toHaveBeenCalledWith('users');
    expect(supabase.insert).toHaveBeenCalled();
    expect(user).toEqual(mockUser);
    
    // Verify hashing (the mock won't actually hash, 
    // but the model will have called bcrypt before calling insert)
    const insertCall = supabase.insert.mock.calls[0][0][0];
    expect(insertCall.password).not.toBe('password123');
  });
});
