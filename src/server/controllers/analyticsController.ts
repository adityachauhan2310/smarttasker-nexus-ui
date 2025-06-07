import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { query, validationResult } from 'express-validator';
import analyticsService, { DateRange } from '../services/analyticsService';
import { ErrorResponse } from '../middleware/errorMiddleware';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';
import { Team } from '../models';

/**
 * @desc    Get personal user analytics
 * @route   GET /api/analytics/user
 * @access  Private
 */
export const getUserAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate query parameters
    await query('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO date').run(req);
    await query('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO date').run(req);
    await query('dateRange').optional().isIn(['day', 'week', 'month', 'quarter', 'year', 'custom']).withMessage('Invalid date range').run(req);
    await query('refresh').optional().isBoolean().withMessage('Refresh must be a boolean').run(req);
    await query('trends').optional().isBoolean().withMessage('Trends must be a boolean').run(req);
    await query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Parse query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const dateRange = req.query.dateRange as DateRange | undefined;
    const refreshCache = req.query.refresh === 'true';
    const includeTrends = req.query.trends === 'true';
    const exportFormat = req.query.format as string || 'json';

    // Get analytics for the current user
    const analytics = await analyticsService.getUserAnalytics(
      req.user!._id,
      {
        startDate,
        endDate,
        dateRange,
        refreshCache,
        includeTrends,
      }
    );

    // Handle different export formats
    if (exportFormat === 'csv') {
      const csvData = await exportToCsv(analytics, 'user_analytics');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="user_analytics.csv"');
      res.status(200).send(csvData);
      return;
    } else if (exportFormat === 'pdf') {
      const pdfBuffer = await exportToPdf(analytics, 'User Analytics');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="user_analytics.pdf"');
      res.status(200).send(pdfBuffer);
      return;
    }

    // Default JSON response
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get team analytics (for team leaders)
 * @route   GET /api/analytics/team
 * @access  Private (Team Leaders only)
 */
export const getTeamAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate query parameters
    await query('teamId').optional().isMongoId().withMessage('Invalid team ID').run(req);
    await query('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO date').run(req);
    await query('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO date').run(req);
    await query('dateRange').optional().isIn(['day', 'week', 'month', 'quarter', 'year', 'custom']).withMessage('Invalid date range').run(req);
    await query('refresh').optional().isBoolean().withMessage('Refresh must be a boolean').run(req);
    await query('trends').optional().isBoolean().withMessage('Trends must be a boolean').run(req);
    await query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Parse query parameters
    const teamId = req.query.teamId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const dateRange = req.query.dateRange as DateRange | undefined;
    const refreshCache = req.query.refresh === 'true';
    const includeTrends = req.query.trends === 'true';
    const exportFormat = req.query.format as string || 'json';

    // Check if user can access this team's analytics
    let targetTeamId: mongoose.Types.ObjectId;
    
    if (teamId) {
      // If teamId is provided, check if user is a leader of this team
      targetTeamId = new mongoose.Types.ObjectId(teamId);
      
      const team = await Team.findById(targetTeamId);
      if (!team) {
        next(new ErrorResponse('Team not found', 404));
        return;
      }
      
      const isTeamLeader = team.leader.toString() === req.user!._id.toString();
      const isAdmin = req.user!.role === 'admin';
      
      if (!isTeamLeader && !isAdmin) {
        next(new ErrorResponse('Not authorized to access this team\'s analytics', 403));
        return;
      }
    } else {
      // If no teamId provided, find a team where the user is a leader
      const leadTeam = await Team.findOne({ leader: req.user!._id });
      
      if (!leadTeam) {
        next(new ErrorResponse('You are not a leader of any team', 403));
        return;
      }
      
      targetTeamId = leadTeam._id;
    }

    // Get team analytics
    const analytics = await analyticsService.getTeamAnalytics(
      targetTeamId,
      {
        startDate,
        endDate,
        dateRange,
        refreshCache,
        includeTrends,
      }
    );

    // Handle different export formats
    if (exportFormat === 'csv') {
      const csvData = await exportToCsv(analytics, 'team_analytics');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="team_analytics.csv"');
      res.status(200).send(csvData);
      return;
    } else if (exportFormat === 'pdf') {
      const pdfBuffer = await exportToPdf(analytics, 'Team Analytics');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="team_analytics.pdf"');
      res.status(200).send(pdfBuffer);
      return;
    }

    // Default JSON response
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get system-wide analytics (admin only)
 * @route   GET /api/analytics/system
 * @access  Private (Admin only)
 */
export const getSystemAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      next(new ErrorResponse('Not authorized to access system analytics', 403));
      return;
    }

    // Validate query parameters
    await query('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO date').run(req);
    await query('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO date').run(req);
    await query('dateRange').optional().isIn(['day', 'week', 'month', 'quarter', 'year', 'custom']).withMessage('Invalid date range').run(req);
    await query('refresh').optional().isBoolean().withMessage('Refresh must be a boolean').run(req);
    await query('trends').optional().isBoolean().withMessage('Trends must be a boolean').run(req);
    await query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Parse query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const dateRange = req.query.dateRange as DateRange | undefined;
    const refreshCache = req.query.refresh === 'true';
    const includeTrends = req.query.trends === 'true';
    const exportFormat = req.query.format as string || 'json';

    // Get system analytics
    const analytics = await analyticsService.getSystemAnalytics({
      startDate,
      endDate,
      dateRange,
      refreshCache,
      includeTrends,
    });

    // Handle different export formats
    if (exportFormat === 'csv') {
      const csvData = await exportToCsv(analytics, 'system_analytics');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="system_analytics.csv"');
      res.status(200).send(csvData);
      return;
    } else if (exportFormat === 'pdf') {
      const pdfBuffer = await exportToPdf(analytics, 'System Analytics');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="system_analytics.pdf"');
      res.status(200).send(pdfBuffer);
      return;
    }

    // Default JSON response
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task completion analytics
 * @route   GET /api/analytics/tasks
 * @access  Private (Admin for system-wide, Team leaders for team, Users for personal)
 */
export const getTaskAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate query parameters
    await query('teamId').optional().isMongoId().withMessage('Invalid team ID').run(req);
    await query('userId').optional().isMongoId().withMessage('Invalid user ID').run(req);
    await query('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO date').run(req);
    await query('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO date').run(req);
    await query('dateRange').optional().isIn(['day', 'week', 'month', 'quarter', 'year', 'custom']).withMessage('Invalid date range').run(req);
    await query('refresh').optional().isBoolean().withMessage('Refresh must be a boolean').run(req);
    await query('trends').optional().isBoolean().withMessage('Trends must be a boolean').run(req);
    await query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Parse query parameters
    const teamId = req.query.teamId as string;
    const userId = req.query.userId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const dateRange = req.query.dateRange as DateRange | undefined;
    const refreshCache = req.query.refresh === 'true';
    const includeTrends = req.query.trends === 'true';
    const exportFormat = req.query.format as string || 'json';

    // Check permissions based on requested scope
    const isAdmin = req.user!.role === 'admin';
    
    // If userId is specified and not the current user, check permissions
    if (userId && userId !== req.user!._id.toString() && !isAdmin) {
      // Only admins can view other users' task analytics
      next(new ErrorResponse('Not authorized to access this user\'s task analytics', 403));
      return;
    }
    
    // If teamId is specified, check if user can access team analytics
    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) {
        next(new ErrorResponse('Team not found', 404));
        return;
      }
      
      const isTeamLeader = team.leader.toString() === req.user!._id.toString();
      const isTeamMember = team.members.some(member => member.toString() === req.user!._id.toString());
      
      if (!isTeamLeader && !isTeamMember && !isAdmin) {
        next(new ErrorResponse('Not authorized to access this team\'s task analytics', 403));
        return;
      }
    }
    
    // Set up options based on scope
    const options = {
      startDate,
      endDate,
      dateRange,
      refreshCache,
      includeTrends,
    };
    
    if (userId) {
      // User-specific task analytics
      const targetUserId = new mongoose.Types.ObjectId(userId);
      Object.assign(options, { userId: targetUserId });
    } else if (teamId) {
      // Team-specific task analytics
      const targetTeamId = new mongoose.Types.ObjectId(teamId);
      Object.assign(options, { teamId: targetTeamId });
    } else if (!isAdmin) {
      // Default to current user if not admin and no specific scope
      Object.assign(options, { userId: req.user!._id });
    }
    
    // Get task analytics
    const analytics = await analyticsService.getTaskAnalytics(options);

    // Handle different export formats
    if (exportFormat === 'csv') {
      const csvData = await exportToCsv(analytics, 'task_analytics');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="task_analytics.csv"');
      res.status(200).send(csvData);
      return;
    } else if (exportFormat === 'pdf') {
      const pdfBuffer = await exportToPdf(analytics, 'Task Analytics');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="task_analytics.pdf"');
      res.status(200).send(pdfBuffer);
      return;
    }

    // Default JSON response
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get trend analysis over time
 * @route   GET /api/analytics/trends
 * @access  Private (Admin for system-wide, Team leaders for team, Users for personal)
 */
export const getTrendAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate query parameters
    await query('teamId').optional().isMongoId().withMessage('Invalid team ID').run(req);
    await query('userId').optional().isMongoId().withMessage('Invalid user ID').run(req);
    await query('startDate').optional().isISO8601().toDate().withMessage('Start date must be a valid ISO date').run(req);
    await query('endDate').optional().isISO8601().toDate().withMessage('End date must be a valid ISO date').run(req);
    await query('dateRange').optional().isIn(['day', 'week', 'month', 'quarter', 'year', 'custom']).withMessage('Invalid date range').run(req);
    await query('refresh').optional().isBoolean().withMessage('Refresh must be a boolean').run(req);
    await query('format').optional().isIn(['json', 'csv', 'pdf']).withMessage('Invalid format').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Parse query parameters
    const teamId = req.query.teamId as string;
    const userId = req.query.userId as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const dateRange = req.query.dateRange as DateRange || 'month'; // Default to month for trends
    const refreshCache = req.query.refresh === 'true';
    const exportFormat = req.query.format as string || 'json';

    // Check permissions based on requested scope (similar to task analytics)
    const isAdmin = req.user!.role === 'admin';
    
    // If userId is specified and not the current user, check permissions
    if (userId && userId !== req.user!._id.toString() && !isAdmin) {
      next(new ErrorResponse('Not authorized to access this user\'s trend analytics', 403));
      return;
    }
    
    // If teamId is specified, check if user can access team analytics
    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) {
        next(new ErrorResponse('Team not found', 404));
        return;
      }
      
      const isTeamLeader = team.leader.toString() === req.user!._id.toString();
      
      if (!isTeamLeader && !isAdmin) {
        next(new ErrorResponse('Not authorized to access this team\'s trend analytics', 403));
        return;
      }
    }
    
    // Set up options based on scope
    const options = {
      startDate,
      endDate,
      dateRange,
      refreshCache,
      includeTrends: true, // Always include trends for this endpoint
    };
    
    if (userId) {
      // User-specific trend analytics
      const targetUserId = new mongoose.Types.ObjectId(userId);
      Object.assign(options, { userId: targetUserId });
    } else if (teamId) {
      // Team-specific trend analytics
      const targetTeamId = new mongoose.Types.ObjectId(teamId);
      Object.assign(options, { teamId: targetTeamId });
    } else if (!isAdmin) {
      // Default to current user if not admin and no specific scope
      Object.assign(options, { userId: req.user!._id });
    }
    
    // Get trend analytics
    const analytics = await analyticsService.getTrendAnalytics(options);

    // Handle different export formats
    if (exportFormat === 'csv') {
      const csvData = await exportToCsv(analytics, 'trend_analytics');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="trend_analytics.csv"');
      res.status(200).send(csvData);
      return;
    } else if (exportFormat === 'pdf') {
      const pdfBuffer = await exportToPdf(analytics, 'Trend Analytics');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="trend_analytics.pdf"');
      res.status(200).send(pdfBuffer);
      return;
    }

    // Default JSON response
    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getUserAnalytics,
  getTeamAnalytics,
  getSystemAnalytics,
  getTaskAnalytics,
  getTrendAnalytics,
}; 