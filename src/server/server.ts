import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import config from './config/config';
import connectDB from './config/database';
import { errorHandler, notFound } from './middleware/errorMiddleware';
import { secureHeaders, securityLogger } from './middleware/securityMiddleware';
import paginationMiddleware from './middleware/paginationMiddleware';
import fieldSelectionMiddleware from './middleware/fieldSelectionMiddleware';
import sortMiddleware from './middleware/sortMiddleware';
import { etagMiddleware, optionsMiddleware, headRequestMiddleware } from './middleware/etagMiddleware';

// Import mongoose for health check
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import taskRoutes from './routes/taskRoutes';
import teamRoutes from './routes/teamRoutes';
import recurringTaskRoutes from './routes/recurringTaskRoutes';
import notificationRoutes from './routes/notificationRoutes';
import chatRoutes from './routes/chatRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import docsRoutes from './routes/docsRoutes';
import calendarRoutes from './routes/calendarRoutes';

// Import services
import taskSchedulerService from './services/taskSchedulerService';
import notificationMonitoringService from './services/notificationMonitoringService';
import emailService from './services/emailService';
import websocketService from './services/websocketService';

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB().catch((err) => {
  if (config.env === 'development') {
    console.warn('MongoDB connection failed. Running with limited functionality in development mode.');
    console.error('MongoDB Error:', err.message);
  } else {
    console.error('MongoDB connection failed. Exiting application.');
    process.exit(1);
  }
});

// Middleware
app.use(secureHeaders); // Set security headers
app.use(cors({
  origin: config.env === 'production' 
    ? config.allowedOrigins 
    : function(origin, callback) {
      // Allow any origin in development mode
      callback(null, true);
    },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies
app.use(cookieParser(config.cookieSecret)); // Parse cookies
app.use(morgan(config.env === 'development' ? 'dev' : 'combined')); // Logging
app.use(securityLogger); // Security logging

// API Enhancement Middleware
app.use(optionsMiddleware); // Handle OPTIONS requests
app.use(headRequestMiddleware); // Handle HEAD requests
app.use(etagMiddleware()); // ETag support
app.use(paginationMiddleware); // Pagination
app.use(fieldSelectionMiddleware); // Field selection
app.use(sortMiddleware); // Sorting

// API Documentation
if (config.env === 'development' || process.env.ENABLE_DOCS === 'true') {
  app.use('/api/docs', docsRoutes);
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/recurring-tasks', recurringTaskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/calendar-events', calendarRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'ok',
    environment: config.env,
    mongodb: mongoStatus,
    timestamp: new Date(),
  });
});

// Serve static assets in production
if (config.env === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../../build')));

  // Any route that is not an API route should serve the index.html
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../../build', 'index.html'));
  });
}

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.env} mode on port ${PORT}`);
  
  // Initialize email service
  emailService.initEmailService();
  
  // Initialize WebSocket service
  websocketService.initialize(server);
  
  // Start services in production (or if explicitly enabled)
  if (config.env === 'production' || process.env.ENABLE_SERVICES === 'true') {
    // Start recurring task scheduler
    taskSchedulerService.startTaskScheduler();
    // Run maintenance task once at startup
    taskSchedulerService.runRecurringTaskMaintenance().catch(console.error);
    
    // Start notification monitoring
    notificationMonitoringService.startNotificationMonitoring();
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  // Stop services
  taskSchedulerService.stopTaskScheduler();
  notificationMonitoringService.stopNotificationMonitoring();
  websocketService.stop();
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app; 