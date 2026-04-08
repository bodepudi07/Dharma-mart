import * as dotenv from 'dotenv';
dotenv.config();
import User from './app/models/User.js';

async function createSetupAdmin() {
  try {
    const existing = await User.findOne({ email: 'admin@dharmamart.com' });
    if(existing) {
      console.log('? Admin already exists! Login: admin@dharmamart.com | pw: admin123');
      process.exit(0);
    }
    await User.create({
      name: 'Super Admin',
      email: 'admin@dharmamart.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('? Admin user created successfully!');
    console.log('Login: admin@dharmamart.com');
    console.log('Password: admin123');
  } catch(e) {
    if(e.message && e.message.includes('relation "users" does not exist')) {
      console.log('? Error: the database tables do not exist yet. Please run the SQL file first!');
    } else {
      console.error(e);
    }
  }
  process.exit(0);
}
createSetupAdmin();
