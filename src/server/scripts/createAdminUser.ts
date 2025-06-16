
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../config/config';
import User from '../models/User';

const createAdminUser = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoURI);
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@smarttasker.ai' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create admin user
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@smarttasker.ai',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      verified: true,
    });

    console.log('Admin user created successfully:');
    console.log('Email: admin@smarttasker.ai');
    console.log('Password: admin123');
    console.log('Please change this password after first login');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createAdminUser();
