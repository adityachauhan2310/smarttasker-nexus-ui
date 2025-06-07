import mongoose from 'mongoose';
import connectDB from '../config/database';

// This file previously contained code to seed admin users,
// but has been intentionally emptied to prevent automatic creation of default users.
// Please use the create-admin script to create admin users.

// Check if this file is being run directly
const isRunningStandalone = import.meta.url.endsWith('seedData.ts');

// When run directly, log a helpful message
if (isRunningStandalone) {
  console.log('⚠️ The automatic seeding of default users has been removed for security reasons.');
  console.log('ℹ️ To create an admin user, please run: npm run create-admin');
  process.exit(0);
} 