import express from 'express';
import * as authController from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { authLimiter } from '../middleware/securityMiddleware';

const router = express.Router();

// Apply rate limiting to authentication routes
router.use(authLimiter);

// Public routes
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshAccessToken);

// Protected routes
router.use(protect); // Apply authentication middleware to all routes below
router.post('/logout', authController.logout);
router.get('/me', authController.getCurrentUser);
router.put('/me', authController.updateProfile);
router.put('/change-password', authController.changePassword);

export default router; 