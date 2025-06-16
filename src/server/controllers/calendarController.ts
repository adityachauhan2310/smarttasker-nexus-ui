import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { body, query, param, validationResult } from 'express-validator';
import { CalendarEvent, User, Team, Task } from '../models';
import { ErrorResponse } from '../middleware/errorMiddleware';

/**
 * @desc    Get calendar events (filtered by date range and permissions)
 * @route   GET /api/calendar-events
 * @access  Private
 */
export const getCalendarEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate query parameters
    await query('startDate').optional().isDate().withMessage('Start date must be a valid date').run(req);
    await query('endDate').optional().isDate().withMessage('End date must be a valid date').run(req);
    await query('type').optional().isString().withMessage('Type must be a string').run(req);
    await query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer').run(req);
    await query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100; // Higher default for calendar views
    const skip = (page - 1) * limit;

    // Date range filter
    const filter: any = {};
    if (req.query.startDate) {
      filter.date = { $gte: new Date(req.query.startDate as string) };
    }
    if (req.query.endDate) {
      if (filter.date) {
        filter.date.$lte = new Date(req.query.endDate as string);
      } else {
        filter.date = { $lte: new Date(req.query.endDate as string) };
      }
    }

    // Type filter
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Permission-based filtering
    if (!req.user) {
      next(new ErrorResponse('Not authorized', 401));
      return;
    }

    // Role-based access control
    // Admins see all events
    // Team leaders see their team's events and their personal events
    // Team members see only their personal events and team events they're part of
    if (req.user.role !== 'admin') {
      const userTeams = await Team.find({ 
        $or: [
          { leader: req.user._id },
          { members: req.user._id }
        ]
      }).select('_id');
      
      const teamIds = userTeams.map(team => team._id);
      
      if (req.user.role === 'team_leader') {
        // Team leaders see their team events and personal events
        filter.$or = [
          { teamId: { $in: teamIds } },
          { assigneeId: req.user._id },
          { attendees: req.user._id }
        ];
      } else {
        // Regular users see only their events and team events they're part of
        filter.$or = [
          { teamId: { $in: teamIds } },
          { assigneeId: req.user._id },
          { attendees: req.user._id }
        ];
      }
    }

    // Count total events with filter
    const total = await CalendarEvent.countDocuments(filter);

    // Get events
    const events = await CalendarEvent.find(filter)
      .populate('assigneeId', 'name email avatar')
      .populate('assignedById', 'name email avatar')
      .populate('teamId', 'name')
      .populate('attendees', 'name email avatar')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limit);

    // Get tasks that have a due date
    const tasks = await Task.find({
      dueDate: { $ne: null },
      ...filter,
    })
      .populate('assignee', 'name email avatar')
      .populate('team', 'name');

    // Combine events and tasks
    const combined = [
      ...events,
      ...tasks.map(task => ({
        id: task._id.toString(),
        title: task.title,
        date: task.dueDate,
        type: 'task',
        description: task.description,
        priority: task.priority,
        status: task.status,
        assigneeId: task.assignee,
        teamId: task.team,
        isTask: true,
      })),
    ];

    res.status(200).json({
      success: true,
      data: {
        events: combined,
      },
      pagination: {
        total: total + tasks.length,
        page,
        limit,
        pages: Math.ceil((total + tasks.length) / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get calendar event by ID
 * @route   GET /api/calendar-events/:id
 * @access  Private
 */
export const getCalendarEventById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      next(new ErrorResponse('Invalid event ID', 400));
      return;
    }

    // Get event
    const event = await CalendarEvent.findById(eventId)
      .populate('assigneeId', 'name email avatar')
      .populate('assignedById', 'name email avatar')
      .populate('teamId', 'name')
      .populate('attendees', 'name email avatar');

    if (!event) {
      next(new ErrorResponse('Event not found', 404));
      return;
    }

    // Check permissions
    const hasAccess = await hasEventAccess(req.user!, event);
    if (!hasAccess) {
      next(new ErrorResponse('Not authorized to access this event', 403));
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        event,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new calendar event
 * @route   POST /api/calendar-events
 * @access  Private
 */
export const createCalendarEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request
    await Promise.all([
      body('title').trim().notEmpty().withMessage('Event title is required').run(req),
      body('description').optional().trim().run(req),
      body('date').isISO8601().toDate().withMessage('Valid date is required').run(req),
      body('time').optional().isString().withMessage('Time must be a string').run(req),
      body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer').run(req),
      body('type').isIn(['meeting', 'deadline', 'task', 'event', 'maintenance', 'audit', 'hr']).withMessage('Invalid event type').run(req),
      body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority level').run(req),
      body('impact').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid impact level').run(req),
      body('attendees').optional().isArray().withMessage('Attendees must be an array').run(req),
      body('attendees.*').optional().isMongoId().withMessage('Valid attendee IDs are required').run(req),
      body('status').optional().isIn(['confirmed', 'tentative', 'cancelled']).withMessage('Invalid status').run(req),
      body('taskId').optional().isMongoId().withMessage('Valid task ID is required').run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Validate attendees if provided
    if (req.body.attendees && req.body.attendees.length > 0) {
      const attendeeIds = req.body.attendees.map((id: string) => new mongoose.Types.ObjectId(id));
      
      const uniqueAttendees = [...new Set(attendeeIds.map(id => id.toString()))];
      if (uniqueAttendees.length !== attendeeIds.length) {
        next(new ErrorResponse('Duplicate attendee IDs provided', 400));
        return;
      }

      const attendees = await User.find({ _id: { $in: attendeeIds } });
      if (attendees.length !== attendeeIds.length) {
        next(new ErrorResponse('One or more attendees not found', 404));
        return;
      }
    }

    const eventData: any = {
      ...req.body,
      assignedById: req.user!._id,
    };

    if (req.user!.role === 'admin') {
      eventData.assigneeId = req.user!._id;
    }

    if (req.body.taskId) {
      eventData.taskId = req.body.taskId;
    }

    // Create event
    const calendarEvent = await CalendarEvent.create(eventData);

    // Populate references
    await calendarEvent.populate('assignedById', 'name email avatar');
    await calendarEvent.populate('teamId', 'name');
    await calendarEvent.populate('attendees', 'name email avatar');

    res.status(201).json({
      success: true,
      data: {
        event: calendarEvent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update calendar event
 * @route   PUT /api/calendar-events/:id
 * @access  Private
 */
export const updateCalendarEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      next(new ErrorResponse('Invalid event ID', 400));
      return;
    }

    // Validate request
    await Promise.all([
      body('title').optional().trim().notEmpty().withMessage('Event title is required if provided').run(req),
      body('description').optional().trim().run(req),
      body('date').optional().isISO8601().toDate().withMessage('Valid date is required if provided').run(req),
      body('time').optional().isString().withMessage('Time must be a string').run(req),
      body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer').run(req),
      body('type').optional().isIn(['meeting', 'deadline', 'task', 'event', 'maintenance', 'audit', 'hr']).withMessage('Invalid event type').run(req),
      body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid priority level').run(req),
      body('impact').optional().isIn(['high', 'medium', 'low']).withMessage('Invalid impact level').run(req),
      body('attendees').optional().isArray().withMessage('Attendees must be an array').run(req),
      body('attendees.*').optional().isMongoId().withMessage('Valid attendee IDs are required').run(req),
      body('assigneeId').optional().isMongoId().withMessage('Valid assignee ID is required').run(req),
      body('teamId').optional().isMongoId().withMessage('Valid team ID is required').run(req),
      body('status').optional().isIn(['confirmed', 'tentative', 'cancelled']).withMessage('Invalid status'),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Check if event exists
    const event = await CalendarEvent.findById(eventId);
    if (!event) {
      next(new ErrorResponse('Event not found', 404));
      return;
    }

    // Check permissions
    const hasAccess = await hasEventManagementAccess(req.user!, event);
    if (!hasAccess) {
      next(new ErrorResponse('Not authorized to update this event', 403));
      return;
    }
    
    // Update event
    const updatedEvent = await CalendarEvent.findByIdAndUpdate(
      eventId,
      { ...req.body },
      { new: true, runValidators: true }
    )
      .populate('assigneeId', 'name email avatar')
      .populate('assignedById', 'name email avatar')
      .populate('teamId', 'name')
      .populate('attendees', 'name email avatar');

    res.status(200).json({
      success: true,
      data: {
        event: updatedEvent,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete calendar event
 * @route   DELETE /api/calendar-events/:id
 * @access  Private
 */
export const deleteCalendarEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const eventId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      next(new ErrorResponse('Invalid event ID', 400));
      return;
    }

    // Check if event exists
    const event = await CalendarEvent.findById(eventId);
    if (!event) {
      next(new ErrorResponse('Event not found', 404));
      return;
    }

    // Check permissions
    const hasAccess = await hasEventManagementAccess(req.user!, event);
    if (!hasAccess) {
      next(new ErrorResponse('Not authorized to delete this event', 403));
      return;
    }

    // Delete event
    await CalendarEvent.findByIdAndDelete(eventId);

    res.status(200).json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to check if a user has access to view an event
 */
async function hasEventAccess(user: any, event: any): Promise<boolean> {
  // Admins have access to all events
  if (user.role === 'admin') {
    return true;
  }

  // Check if user is the assignee or creator
  if (
    (event.assigneeId && event.assigneeId.toString() === user._id.toString()) ||
    (event.assignedById && event.assignedById.toString() === user._id.toString()) ||
    (event.attendees && event.attendees.some((attendee: any) => 
      attendee._id.toString() === user._id.toString() || 
      attendee.toString() === user._id.toString()
    ))
  ) {
    return true;
  }

  // Check if user is part of the team
  if (event.teamId) {
    const team = await Team.findById(event.teamId);
    if (team) {
      const isTeamLeader = team.leader.toString() === user._id.toString();
      const isTeamMember = team.members.some((member: any) => member.toString() === user._id.toString());
      
      if (isTeamLeader || isTeamMember) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Helper function to check if a user has management access to an event
 */
async function hasEventManagementAccess(user: any, event: any): Promise<boolean> {
  // Admins have management access to all events
  if (user.role === 'admin') {
    return true;
  }

  // Event creators can manage their events
  if (event.assignedById && event.assignedById.toString() === user._id.toString()) {
    return true;
  }

  // Team leaders can manage their team's events
  if (event.teamId) {
    const team = await Team.findById(event.teamId);
    if (team && team.leader.toString() === user._id.toString()) {
      return true;
    }
  }

  return false;
} 