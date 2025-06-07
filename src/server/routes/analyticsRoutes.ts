import express from 'express';
import * as analyticsController from '../controllers/analyticsController';
import { protect, authorize } from '../middleware/authMiddleware';
import { rateLimit } from 'express-rate-limit';
import { cacheMiddleware } from '../middleware/cacheMiddleware';

const router = express.Router();

// Apply rate limiting to analytics endpoints (more generous than normal endpoints)
const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 requests per 5 minutes
  message: 'Too many analytics requests, please try again later'
});

// Apply authentication to all routes
router.use(protect);

// Apply rate limiting to all analytics routes
router.use(analyticsLimiter);

// Analytics endpoints
router.get('/user', analyticsController.getUserAnalytics);
router.get('/team', analyticsController.getTeamAnalytics);
router.get('/system', analyticsController.getSystemAnalytics);
router.get('/tasks', analyticsController.getTaskAnalytics);
router.get('/trends', analyticsController.getTrendAnalytics);

export default router; 