import mongoose from 'mongoose';
import { User } from '../models';
import connectDB from '../config/database';
import readline from 'readline';

/**
 * Create a readline interface for user input
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Prompt user for input
 */
const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      resolve(answer);
    });
  });
};

/**
 * Create a custom admin user with provided credentials
 */
const createCustomAdmin = async (closeDatabaseAfter: boolean = true): Promise<void> => {
  let connectionOpened = false;
  try {
    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      await connectDB();
      connectionOpened = true;
      console.log('Connected to MongoDB');
    }

    // Get user credentials
    const email = await askQuestion('Enter admin email [admin@smarttasker.ai]: ') || 'admin@smarttasker.ai';
    const name = await askQuestion('Enter admin name [Admin User]: ') || 'Admin User';
    const password = await askQuestion('Enter admin password [Admin@123]: ') || 'Admin@123';

    // Check if a user with the email already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      const confirm = await askQuestion(`User with email ${email} already exists. Update password? (y/n): `);
      if (confirm.toLowerCase() === 'y') {
        // Update existing user
        existingUser.name = name;
        existingUser.password = password; // Will be hashed by pre-save hook
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`\nAdmin user updated with email: ${email}`);
      } else {
        console.log('Operation cancelled.');
      }
    } else {
      // Create new admin user
      const admin = await User.create({
        name,
        email,
        password, // Will be hashed by pre-save hook
        role: 'admin',
        verified: true,
        isActive: true
      });
      
      console.log('\n----------------------------------------');
      console.log(`Admin user created successfully!`);
      console.log(`Email: ${admin.email}`);
      console.log(`Password: ${password}`);
      console.log('----------------------------------------');
    }
  } catch (error) {
    console.error('Error creating admin user:', 
      error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
    
    // Close MongoDB connection if we opened it and closeDatabaseAfter is true
    if (connectionOpened && closeDatabaseAfter && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
    
    // Exit the process if we're closing the database
    if (closeDatabaseAfter) {
      process.exit(0);
    }
  }
};

// Run the function if called directly
if (import.meta.url.endsWith('seedCustomAdmin.ts')) {
  createCustomAdmin(true);
}

export default createCustomAdmin; 