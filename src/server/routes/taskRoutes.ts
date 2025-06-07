import express from 'express';
import * as taskController from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';
import { limiter } from '../middleware/securityMiddleware';
import { cacheResponse, taskCacheClearer } from '../middleware/cacheMiddleware';

const router = express.Router();

// Apply rate limiting
router.use(limiter);

// Apply authentication middleware to all routes
router.use(protect);

// Task metrics endpoint - cache for 10 minutes
router.get('/metrics', cacheResponse(600), taskController.getTaskMetrics);

// Task CRUD endpoints
router.route('/')
  .get(cacheResponse(300), taskController.getTasks) // Cache task lists for 5 minutes
  .post(taskCacheClearer, taskController.createTask);

router.route('/:id')
  .get(cacheResponse(300), taskController.getTaskById) // Cache individual tasks for 5 minutes
  .put(taskCacheClearer, taskController.updateTask)
  .delete(taskCacheClearer, taskController.deleteTask);

// Task assignment endpoints
router.route('/:id/assign')
  .post(taskCacheClearer, taskController.assignTask)
  .delete(taskCacheClearer, taskController.removeAssignment);

// Task status and priority endpoints
router.put('/:id/status', taskCacheClearer, taskController.updateTaskStatus);
router.put('/:id/priority', taskCacheClearer, taskController.updateTaskPriority);

// Task comments endpoints
router.route('/:id/comments')
  .post(taskCacheClearer, taskController.addComment);

router.route('/:id/comments/:commentId')
  .put(taskCacheClearer, taskController.updateComment)
  .delete(taskCacheClearer, taskController.deleteComment);

export default router; 