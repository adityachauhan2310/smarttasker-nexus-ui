import mongoose from 'mongoose';
import config from './config';

// Mongoose options
const options = {
  autoIndex: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  family: 4, // Use IPv4, skip trying IPv6
  connectTimeoutMS: 10000,
  retryWrites: true,
  maxPoolSize: 10,
  minPoolSize: 2,
  heartbeatFrequencyMS: 10000,
};

// Flag to track if event listeners are set
let eventsSet = false;

// Setup connection event listeners
const setupConnectionEvents = () => {
  if (eventsSet) return; // Only set event listeners once
  
  // Handle connection errors after initial connection
  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB connection error: ${err}`);
    // Don't attempt reconnection here - mongoose will do this automatically
  });
  
  // Handle disconnection
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Mongoose will attempt to reconnect automatically...');
  });
  
  // Handle reconnection
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected successfully');
  });
  
  // Handle close event (usually from the app side)
  mongoose.connection.on('close', () => {
    console.log('MongoDB connection closed');
  });
  
  eventsSet = true;
};

// Connect to MongoDB with retry mechanism
const connectDB = async (retries = 5, interval = 5000): Promise<mongoose.Connection | null> => {
  let retryAttempts = 0;
  let lastError: Error | null = null;

  // Setup connection event listeners
  setupConnectionEvents();

  // Try to connect with retries
  while (retryAttempts < retries) {
    try {
      if (retryAttempts > 0) {
        console.log(`Retry attempt ${retryAttempts}/${retries} connecting to MongoDB...`);
      }

      const conn = await mongoose.connect(config.mongoUri, options);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      
      // Return the connection
      return conn.connection;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`MongoDB connection attempt ${retryAttempts + 1} failed: ${lastError.message}`);
      
      retryAttempts++;
      
      if (retryAttempts < retries) {
        console.log(`Waiting ${interval/1000} seconds before retrying...`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  // If we get here, all connection attempts failed
  if (config.env === 'development') {
    console.warn('All MongoDB connection attempts failed. Running with limited functionality in development mode.');
    return null;
  } else {
    // In production, exit the application
    console.error('All MongoDB connection attempts failed. Exiting application.');
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
  } catch (err) {
    // Ignore errors during shutdown
  }
  process.exit(0);
});

export default connectDB; 