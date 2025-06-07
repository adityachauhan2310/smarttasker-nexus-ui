import mongoose from 'mongoose';
import { User } from '../models';
import connectDB from '../config/database';
import bcrypt from 'bcrypt';
import config from '../config/config';

/**
 * Reset admin password
 */
const resetAdminPassword = async (email: string = 'admin@smarttasker.ai', closeDatabaseAfter: boolean = true): Promise<void> => {
  let connectionOpened = false;
  try {
    // Check if MongoDB is already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      await connectDB();
      connectionOpened = true;
      console.log('Connected to MongoDB');
    }
    
    // Find admin user by email
    const admin = await User.findOne({ email });
    
    if (!admin) {
      console.error(`No user found with email: ${email}`);
      return;
    }
    
    // Generate new password
    const newPassword = 'Admin@123';
    
    // Hash the password
    const salt = await bcrypt.genSalt(config.bcryptSaltRounds);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('----------------------------------------');
    console.log(`Password reset successfully for: ${email}`);
    console.log(`New password is: ${newPassword}`);
    console.log('----------------------------------------');
    
  } catch (error) {
    console.error('Error resetting password:', 
      error instanceof Error ? error.message : String(error));
  } finally {
    // Only close MongoDB if we opened it ourselves and closeDatabaseAfter is true
    if (connectionOpened && closeDatabaseAfter && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed after password reset');
    }
  }
};

// Allow script to be run directly
if (import.meta.url.endsWith('resetAdminPassword.ts')) {
  const email = process.argv[2] || 'admin@smarttasker.ai';
  
  resetAdminPassword(email, true)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unhandled error during password reset:', error);
      process.exit(1);
    });
}

export default resetAdminPassword; 