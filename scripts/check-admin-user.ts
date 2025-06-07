import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import config from '../src/server/config/config';

// MongoDB connection options
const mongoOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  connectTimeoutMS: 10000,
};

// Function to check and repair the admin user
async function checkAndRepairAdminUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri, mongoOptions);
    console.log('Connected to MongoDB');

    // Import User model after connection to avoid model compilation errors
    const { default: User } = await import('../src/server/models/User');

    // Check if admin user exists
    console.log('Checking for admin user...');
    const admin = await User.findOne({ email: 'admin@smarttasker.ai' });

    if (!admin) {
      console.log('Admin user not found. Creating a new admin user...');
      
      // Hash password manually to ensure it's correct
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      console.log('Password hashed:', hashedPassword);
      
      // Create new admin user with directly inserted hash
      const newAdmin = await User.create({
        name: 'Admin User',
        email: 'admin@smarttasker.ai',
        password: hashedPassword,
        role: 'admin',
        verified: true,
        isActive: true
      });
      
      console.log('New admin user created successfully with ID:', newAdmin._id);
    } else {
      console.log('Admin user found:');
      console.log(`- ID: ${admin._id}`);
      console.log(`- Name: ${admin.name}`);
      console.log(`- Email: ${admin.email}`);
      console.log(`- Role: ${admin.role}`);
      console.log(`- Active: ${admin.isActive}`);
      console.log(`- Verified: ${admin.verified}`);
      
      // Reset password by directly setting a hash
      console.log('Manually resetting admin password hash...');
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      
      // Directly update the password hash in the database to bypass any hooks
      await User.updateOne(
        { _id: admin._id },
        { $set: { password: hashedPassword } }
      );
      
      console.log('Admin password reset successfully with hash:', hashedPassword);
      
      // Check if we can verify the password
      const testPassword = 'Admin@123';
      const isMatch = await bcrypt.compare(testPassword, hashedPassword);
      console.log(`Password verification test: ${isMatch ? 'PASSED' : 'FAILED'}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
checkAndRepairAdminUser(); 