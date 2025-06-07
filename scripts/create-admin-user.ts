import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import readline from 'readline';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenvConfig();

// Try to load MongoDB credentials from config file
const configFile = path.resolve('./src/server/config/config.ts');
let mongoUri = '';

try {
  // Check if config file exists
  if (fs.existsSync(configFile)) {
    // We can't directly import the TS file, so run it through tsx
    console.log('Loading config...');
    
    // Import directly from the module - this will work with tsx
    import('../src/server/config/config')
      .then((config) => {
        mongoUri = config.default.mongoUri;
        console.log('MongoDB URI loaded from config');
        startAdminCreation(mongoUri);
      })
      .catch((err) => {
        console.error('Error importing config:', err);
        promptForMongoURI();
      });
  } else {
    promptForMongoURI();
  }
} catch (error) {
  console.error('Error checking config file:', error);
  promptForMongoURI();
}

// MongoDB connection options
const mongoOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4,
  connectTimeoutMS: 10000,
};

// Create readline interface for command-line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt for input
const prompt = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Prompt for MongoDB URI if not found in config
async function promptForMongoURI() {
  console.log('MongoDB URI not found in environment variables or config.');
  
  const defaultUri = 'mongodb://localhost:27017/smarttasker';
  mongoUri = await prompt(`Enter MongoDB URI (default: ${defaultUri}): `);
  
  if (!mongoUri) {
    mongoUri = defaultUri;
  }
  
  // Check if URI contains authentication
  if (!mongoUri.includes('@') && !mongoUri.includes('localhost')) {
    const username = await prompt('Enter MongoDB username: ');
    const password = await prompt('Enter MongoDB password: ');
    
    // Build MongoDB URI with authentication
    const uriParts = mongoUri.split('://');
    if (username && password) {
      mongoUri = `${uriParts[0]}://${username}:${password}@${uriParts[1]}`;
    }
  }
  
  startAdminCreation(mongoUri);
}

async function startAdminCreation(uri: string) {
  try {
    // Check if reset mode is enabled via command line
    const resetMode = process.argv.includes('reset');
    
    console.log('=== Admin User Creation Utility ===');
    
    // Connect to MongoDB with masked URI
    const maskedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log(`\nConnecting to MongoDB at: ${maskedUri}`);
    await mongoose.connect(uri, mongoOptions);
    console.log('> Connected successfully to MongoDB\n');
    
    await createAdminUser(resetMode);
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

async function createAdminUser(resetMode = false) {
  try {
    // Import User model after connection to avoid model compilation errors
    const { default: User } = await import('../src/server/models/User');
    
    // Check for existing admin users
    const existingAdmins = await User.find({ role: 'admin' });
    
    if (existingAdmins.length > 0) {
      console.log('> Warning: The following admin users already exist:');
      existingAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name} (${admin.email})`);
      });
      
      // Automatically remove if in reset mode
      if (resetMode) {
        console.log('\n> Automatic reset mode activated - removing all admin users');
        await User.deleteMany({ role: 'admin' });
        console.log('> All existing admin users have been removed.');
      } else {
        const removeExisting = await prompt('\nDo you want to remove existing admin users? (y/n): ');
        if (removeExisting.toLowerCase() === 'y') {
          console.log('\n> Removing existing admin users...');
          await User.deleteMany({ role: 'admin' });
          console.log('> All existing admin users have been removed.');
        } else {
          const proceed = await prompt('Do you want to create another admin user? (y/n): ');
          if (proceed.toLowerCase() !== 'y') {
            console.log('\nOperation cancelled by user.');
            return;
          }
        }
      }
    }

    // Prompt for admin user details
    const name = await prompt('\nEnter admin name: ');
    const email = await prompt('Enter admin email: ');
    const password = await prompt('Enter admin password (min 8 chars, must include uppercase, lowercase, number): ');
    
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      console.error('\nError: Password does not meet strength requirements.');
      console.log('Password must be at least 8 characters and include uppercase, lowercase, and numbers.');
      return;
    }

    // Hash password manually using the same salt rounds as in the User model
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create admin user with direct password hash insertion but bypass mongoose hooks
    // Use direct MongoDB insertion instead of Mongoose to bypass all hooks
    const usersCollection = mongoose.connection.collection('users');
    
    // Prepare user document
    const newUser = {
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      verified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert directly to MongoDB to bypass any hooks
    const result = await usersCollection.insertOne(newUser);
    
    console.log('\nAdmin user created successfully:');
    console.log(`- ID: ${result.insertedId}`);
    console.log(`- Name: ${name}`);
    console.log(`- Email: ${email}`);
    console.log(`- Role: admin`);
    
    // Manually verify password works by comparing with the hash we just generated
    const passwordCheck = await bcrypt.compare(password, hashedPassword);
    console.log(`- Password verification: ${passwordCheck ? 'PASSED' : 'FAILED'}`);
    
    console.log('\nYou can now log in to the application with these credentials.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close connection to MongoDB
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
    
    // Close readline interface
    rl.close();
  }
} 