import express from 'express';
import * as notificationController from '../controllers/notificationController';
import { protect, authorize } from '../middleware/authMiddleware';
import { cacheMiddleware } from '../middleware/cacheMiddleware';
import { limiter } from '../middleware/securityMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Get all notifications for current user with optional filtering
router.get('/', cacheMiddleware('userNotifications', 60), notificationController.getNotifications);

// Get notification count
router.get('/count', cacheMiddleware('notificationCount', 30), notificationController.getNotificationCount);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllNotificationsAsRead);

// Get, mark as read, or delete a specific notification
router.route('/:id')
  .delete(notificationController.deleteNotification);

// Mark notification as read
router.put('/:id/read', notificationController.markNotificationAsRead);

// Test endpoint for generating notifications (admin only)
router.post('/test', authorize('admin'), notificationController.generateTestNotification);

export default router; 