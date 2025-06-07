import express from 'express';
import * as teamController from '../controllers/teamController';
import { protect, authorize } from '../middleware/authMiddleware';
import { cacheMiddleware } from '../middleware/cacheMiddleware';

const router = express.Router();

// Base routes
router
  .route('/')
  .get(protect, cacheMiddleware('teams', 300), teamController.getTeams)
  .post(protect, authorize('admin'), teamController.createTeam);

router
  .route('/:id')
  .get(protect, cacheMiddleware('team', 300), teamController.getTeamById)
  .put(protect, teamController.updateTeam)
  .delete(protect, authorize('admin'), teamController.deleteTeam);

// Team member management routes
router
  .route('/:id/members')
  .get(protect, cacheMiddleware('teamMembers', 300), teamController.getTeamMembers)
  .post(protect, teamController.addTeamMember);

router
  .route('/:id/members/:userId')
  .delete(protect, teamController.removeTeamMember);

// Team leader management
router
  .route('/:id/leader')
  .put(protect, authorize('admin'), teamController.changeTeamLeader);

// Team task management routes
router
  .route('/:id/tasks')
  .get(protect, teamController.getTeamTasks)
  .post(protect, teamController.createTeamTask);

// Team analytics
router
  .route('/:id/analytics')
  .get(protect, teamController.getTeamAnalytics);

export default router; 