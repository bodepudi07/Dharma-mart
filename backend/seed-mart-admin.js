import bcrypt from 'bcryptjs';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, 'database');

async function seedAdmin() {
    const vendorsPath = path.join(dbDir, 'mart_vendors.json');
    const vendors = JSON.parse(await fs.readFile(vendorsPath, 'utf8'));
    
    const admin = vendors.find(v => v.email === 'official@dharmamart.com');
    if (admin && admin.password && !admin.password.startsWith('$2a$')) {
        // Hash the password
        admin.password = await bcrypt.hash('Dharmamart@TechnicalAdmin', 10);
        admin.joinedAt = new Date().toISOString();
        await fs.writeFile(vendorsPath, JSON.stringify(vendors, null, 2), 'utf8');
        console.log('✅ Admin vendor account seeded: official@dharmamart.com');
    } else if (admin && admin.password.startsWith('$2a$')) {
        console.log('ℹ️  Admin vendor already seeded.');
    } else {
        // Create new admin
        const newAdmin = {
            id: 1,
            email: 'official@dharmamart.com',
            password: await bcrypt.hash('Dharmamart@TechnicalAdmin', 10),
            name: 'Dharma Mart Official',
            storeName: 'Dharma Mart Official Store',
            storeDescription: 'The official Dharma Mart store — authentic devotional products curated with love and reverence for Sanatana Dharma.',
            storeLogo: '',
            phone: '+91-9999999999',
            address: 'Hyderabad, Telangana, India',
            gstin: '',
            role: 'super_admin',
            status: 'active',
            verified: true,
            rating: 5.0,
            totalSales: 0,
            totalRevenue: 0,
            totalProducts: 25,
            joinedAt: new Date().toISOString(),
            lastLoginAt: null,
            bankDetails: { accountName: '', accountNumber: '', ifscCode: '', bankName: '' },
            policies: {
                returnPolicy: '7-day hassle-free returns on all items',
                shippingPolicy: 'Free shipping on orders above ₹499. Standard delivery in 5-7 business days.',
                cancellationPolicy: 'Orders can be cancelled within 24 hours of placement'
            }
        };
        vendors.push(newAdmin);
        await fs.writeFile(vendorsPath, JSON.stringify(vendors, null, 2), 'utf8');
        console.log('✅ Admin vendor account created: official@dharmamart.com');
    }
}

seedAdmin().catch(console.error);
