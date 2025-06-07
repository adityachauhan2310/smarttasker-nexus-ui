import express from 'express';
import * as userController from '../controllers/userController';
import { protect, authorize } from '../middleware/authMiddleware';
import { limiter } from '../middleware/securityMiddleware';
import * as userPreferencesController from '../controllers/userPreferencesController';

const router = express.Router();

// Apply rate limiting
router.use(limiter);

// Apply authentication middleware
router.use(protect);

// Apply authorization middleware - only admins can access these routes
router.use(authorize('admin'));

// Admin routes for user management
router.route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

router.route('/:id')
  .get(userController.getUser)
  .put(userController.updateUser)
  .delete(userController.deleteUser);

router.put('/:id/reset-password', userController.resetPassword);

// User notification preferences
router
  .route('/preferences/notifications')
  .get(userPreferencesController.getNotificationPreferences)
  .put(userPreferencesController.updateNotificationPreferences);

// Toggle notification mute status
router.put(
  '/preferences/notifications/toggle-mute/:type/:channel',
  userPreferencesController.toggleNotificationMute
);

export default router; 