import express from 'express';
import * as recurringTaskController from '../controllers/recurringTaskController';
import { protect, authorize } from '../middleware/authMiddleware';
import { cacheMiddleware } from '../middleware/cacheMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

// Base CRUD routes
router.route('/')
  .get(cacheMiddleware('recurringTasks', 300), recurringTaskController.getRecurringTasks)
  .post(recurringTaskController.createRecurringTask);

router.route('/:id')
  .get(cacheMiddleware('recurringTask', 300), recurringTaskController.getRecurringTaskById)
  .put(recurringTaskController.updateRecurringTask)
  .delete(recurringTaskController.deleteRecurringTask);

// Task pattern management routes
router.route('/:id/pause')
  .put(recurringTaskController.pauseRecurringTask);

router.route('/:id/resume')
  .put(recurringTaskController.resumeRecurringTask);

router.route('/:id/generate')
  .post(recurringTaskController.generateTasksNow);

router.route('/:id/stats')
  .get(cacheMiddleware('recurringTaskStats', 300), recurringTaskController.getRecurringTaskStats);

// Skip date management
router.route('/:id/skip-date')
  .post(recurringTaskController.addSkipDate);

router.route('/:id/skip-date/:dateId')
  .delete(recurringTaskController.removeSkipDate);

export default router; 