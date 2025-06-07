import express from 'express';
import * as chatController from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Apply rate limiting
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many chat requests, please try again later'
});

// Apply authentication to all routes
router.use(protect);

// Chat endpoints
router.post('/', chatLimiter, chatController.sendMessage);

// Task extraction
router.post('/extract-task', chatController.extractTask);

// Chat history
router.get('/history', chatController.getChatHistory);
router.delete('/history', chatController.clearChatHistory);

// Feedback
router.post('/feedback', chatController.submitFeedback);

// Chat operations
router.get('/:id', chatController.getChat);
router.delete('/:id', chatController.deleteChat);
router.post('/:id/generate-title', chatController.generateChatTitle);

export default router; 