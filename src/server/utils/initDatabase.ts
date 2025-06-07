import mongoose from 'mongoose';
import connectDB from '../config/database';
import { User, Team, Task, RecurringTask } from '../models';

/**
 * Initialize database with required collections
 */
export const initDatabase = async (closeDatabaseAfter: boolean = true): Promise<void> => {
  let connectionOpened = false;
  try {
    // Check if MongoDB is already connected
    if (mongoose.connection.readyState !== 1) {
      console.log('Connecting to MongoDB...');
      await connectDB();
      connectionOpened = true;
      console.log('Connected to MongoDB successfully');
    }
    
    console.log('\n=== Initializing Database Structure ===\n');
    
    // Create collections if they don't exist
    // This is done by accessing the models, which will create the collections
    console.log('Ensuring collections exist...');
    
    // Check if collections exist by querying them
    const userCount = await User.estimatedDocumentCount();
    console.log(`- Users collection exists with ${userCount} documents`);
    
    const teamCount = await Team.estimatedDocumentCount();
    console.log(`- Teams collection exists with ${teamCount} documents`);
    
    const taskCount = await Task.estimatedDocumentCount();
    console.log(`- Tasks collection exists with ${taskCount} documents`);
    
    const recurringTaskCount = await RecurringTask.estimatedDocumentCount();
    console.log(`- RecurringTasks collection exists with ${recurringTaskCount} documents`);
    
    console.log('\nDatabase structure initialized successfully.');
    console.log('\nNext steps:');
    console.log('1. Create an admin user with: npm run create-admin');
    console.log('2. Start the application with: npm run dev & npm run server:dev');
    
  } catch (error) {
    console.error('Error initializing database:', 
      error instanceof Error ? error.message : String(error));
  } finally {
    // Only close MongoDB if we opened it ourselves and closeDatabaseAfter is true
    if (connectionOpened && closeDatabaseAfter && mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
};

// Allow script to be run directly
if (import.meta.url.endsWith('initDatabase.ts')) {
  initDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Unhandled error during database initialization:', error);
      process.exit(1);
    });
}

export default initDatabase; 