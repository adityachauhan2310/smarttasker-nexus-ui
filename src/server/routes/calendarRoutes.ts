import express from 'express';
import * as calendarController from '../controllers/calendarController';
import { protect } from '../middleware/authMiddleware';
import { cacheMiddleware } from '../middleware/cacheMiddleware';

const router = express.Router();

// Base routes
router
  .route('/')
  .get(protect, cacheMiddleware('calendar-events', 60), calendarController.getCalendarEvents)
  .post(protect, calendarController.createCalendarEvent);

router
  .route('/:id')
  .get(protect, cacheMiddleware('calendar-event', 60), calendarController.getCalendarEventById)
  .put(protect, calendarController.updateCalendarEvent)
  .delete(protect, calendarController.deleteCalendarEvent);

export default router; 