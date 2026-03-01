/**
 * Seed script: creates sample admin and users for testing.
 * Run: node scripts/seed.js (from backend folder, with MONGODB_URI set)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'YOUR_MONGODB_CONNECTION_STRING';

async function seed() {
  if (MONGODB_URI === 'YOUR_MONGODB_CONNECTION_STRING') {
    console.log('Set MONGODB_URI in .env and run again.');
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  const hashed = await bcrypt.hash('admin123', 12);

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    await User.create({
      name: 'Admin User',
      email: 'admin@mlm.com',
      mobile: '9999999999',
      password: hashed,
      memberId: 'NM10000',
      referralCode: 'NM10000',
      role: 'admin',
      businessType: 'Platform',
      level: 0,
    });
    console.log('Admin created: admin@mlm.com / Member ID: NM10000 / Password: admin123');
  }

  const root = await User.findOne({ memberId: 'NM10001' });
  if (!root) {
    await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      mobile: '9876543210',
      password: await bcrypt.hash('password123', 12),
      memberId: 'NM10001',
      referralCode: 'NM10001',
      businessType: 'Retail',
      level: 1,
    });
    console.log('Sample user: john@example.com / NM10001 / password123');
  }

  console.log('Seed done.');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
