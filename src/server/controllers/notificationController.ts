import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { query, param, validationResult, body } from 'express-validator';
import { Notification } from '../models';
import { ErrorResponse } from '../middleware/errorMiddleware';
import { clearEntityCache } from '../middleware/cacheMiddleware';
import { User } from '../models';

/**
 * @desc    Get all notifications for the current user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate query parameters
    await query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer').run(req);
    await query('limit').optional().isInt({ min: 1, max: 50 }).toInt().withMessage('Limit must be between 1 and 50').run(req);
    await query('read').optional().isBoolean().withMessage('Read status must be a boolean').run(req);

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
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = { user: req.user!._id };

    // Filter by read status if provided
    if (req.query.read !== undefined) {
      filter.read = req.query.read === 'true';
    }

    // Get total count
    const total = await Notification.countDocuments(filter);

    // Get notifications with population of references based on type
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Populate references based on notification types
    const populatedNotifications = await populateNotificationReferences(notifications);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      user: req.user!._id,
      read: false,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: populatedNotifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notificationId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      next(new ErrorResponse('Invalid notification ID', 400));
      return;
    }

    // Find the notification
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      next(new ErrorResponse('Notification not found', 404));
      return;
    }

    // Check if notification belongs to the current user
    if (notification.user.toString() !== req.user!._id.toString()) {
      next(new ErrorResponse('Not authorized to access this notification', 403));
      return;
    }

    // Mark as read
    await notification.markAsRead();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const currentTime = new Date();

    // Update all unread notifications for the user
    const result = await Notification.updateMany(
      { user: req.user!._id, read: false },
      { $set: { read: true, readAt: currentTime } }
    );

    // Clear any related cache
    await clearEntityCache('notifications');

    res.status(200).json({
      success: true,
      count: result.modifiedCount,
      message: `${result.modifiedCount} notifications marked as read`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notificationId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      next(new ErrorResponse('Invalid notification ID', 400));
      return;
    }

    // Find the notification
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      next(new ErrorResponse('Notification not found', 404));
      return;
    }

    // Check if notification belongs to the current user
    if (notification.user.toString() !== req.user!._id.toString()) {
      next(new ErrorResponse('Not authorized to delete this notification', 403));
      return;
    }

    // Delete the notification
    await notification.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get notification count for the current user
 * @route   GET /api/notifications/count
 * @access  Private
 */
export const getNotificationCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get total and unread counts
    const [total, unread] = await Promise.all([
      Notification.countDocuments({ user: req.user!._id }),
      Notification.countDocuments({ user: req.user!._id, read: false }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        total,
        unread,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate a test notification (for debugging)
 * @route   POST /api/notifications/test
 * @access  Private (Admin only)
 */
export const generateTestNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate input
    await body('type').isIn([
      'TaskAssigned',
      'TaskDue',
      'TaskOverdue',
      'MentionedInComment',
      'TeamChanged',
      'RecurringTaskGenerated',
      'TeamMemberAdded',
      'TeamMemberRemoved',
      'TeamLeaderChanged'
    ]).withMessage('Invalid notification type').run(req);
    
    await body('userId').optional().isMongoId().withMessage('Invalid user ID').run(req);
    await body('sendEmail').optional().isBoolean().withMessage('sendEmail must be boolean').run(req);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }
    
    const { type, userId, sendEmail = false } = req.body;
    
    // Use the provided userId or the current user's ID
    const targetUserId = userId || req.user!._id;
    const currentUser = req.user!;
    
    // Create a test notification based on the type
    let notification;
    
    switch (type) {
      case 'TaskAssigned':
        notification = await Notification.create({
          user: targetUserId,
          type,
          title: 'Test Task Assignment',
          message: 'This is a test task assignment notification',
          priority: 'normal',
          reference: {
            refType: 'Task',
            refId: new mongoose.Types.ObjectId(),
          },
          relatedRefs: [{
            refType: 'User',
            refId: currentUser._id,
          }],
          data: {
            taskTitle: 'Test Task',
          },
          read: false,
          emailSent: false,
        });
        break;
        
      case 'TaskDue':
        notification = await Notification.create({
          user: targetUserId,
          type,
          title: 'Test Task Due Soon',
          message: 'This is a test task due soon notification',
          priority: 'high',
          reference: {
            refType: 'Task',
            refId: new mongoose.Types.ObjectId(),
          },
          data: {
            taskTitle: 'Test Task',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
          },
          read: false,
          emailSent: false,
        });
        break;
        
      case 'TaskOverdue':
        notification = await Notification.create({
          user: targetUserId,
          type,
          title: 'Test Task Overdue',
          message: 'This is a test task overdue notification',
          priority: 'urgent',
          reference: {
            refType: 'Task',
            refId: new mongoose.Types.ObjectId(),
          },
          data: {
            taskTitle: 'Test Task',
            dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          },
          read: false,
          emailSent: false,
        });
        break;
        
      case 'MentionedInComment':
        notification = await Notification.create({
          user: targetUserId,
          type,
          title: 'Test Mention in Comment',
          message: 'You were mentioned in a comment on task "Test Task"',
          priority: 'normal',
          reference: {
            refType: 'Task',
            refId: new mongoose.Types.ObjectId(),
          },
          relatedRefs: [
            {
              refType: 'User',
              refId: currentUser._id,
            },
            {
              refType: 'Comment',
              refId: new mongoose.Types.ObjectId(),
            },
          ],
          data: {
            taskTitle: 'Test Task',
            commentText: 'Hey @user, check this out!',
          },
          read: false,
          emailSent: false,
        });
        break;
        
      default:
        notification = await Notification.create({
          user: targetUserId,
          type,
          title: `Test ${type} Notification`,
          message: `This is a test notification for type ${type}`,
          priority: 'normal',
          read: false,
          emailSent: false,
        });
    }
    
    // Send email if requested
    if (sendEmail && notification) {
      // Import here to avoid circular dependency
      const { sendEmail } = require('../services/emailService');
      const { renderEmailTemplate } = require('../services/emailService');
      
      // Get user email
      const user = await User.findById(targetUserId);
      
      if (user && user.email) {
        // Create simple HTML content
        const html = `
          <h1>${notification.title}</h1>
          <p>${notification.message}</p>
          <p>This is a test notification email generated from the API.</p>
        `;
        
        await sendEmail({
          to: user.email,
          subject: `Test Notification: ${notification.title}`,
          html,
        });
        
        notification.emailSent = true;
        notification.emailSentAt = new Date();
        await notification.save();
      }
    }
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Test notification created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to populate notifications with references based on type
 * @param notifications Array of notifications to populate
 */
async function populateNotificationReferences(notifications: any[]): Promise<any[]> {
  if (!notifications.length) return notifications;

  const { Task, Team, User } = mongoose.models;
  
  // Group notifications by reference types to optimize population
  const taskRefs = new Set<string>();
  const teamRefs = new Set<string>();
  const userRefs = new Set<string>();
  
  // Collect all reference IDs
  for (const notification of notifications) {
    if (notification.reference) {
      const { refType, refId } = notification.reference;
      if (refType === 'Task') taskRefs.add(refId.toString());
      else if (refType === 'Team') teamRefs.add(refId.toString());
      else if (refType === 'User') userRefs.add(refId.toString());
    }
    
    if (notification.relatedRefs && notification.relatedRefs.length) {
      for (const ref of notification.relatedRefs) {
        const { refType, refId } = ref;
        if (refType === 'Task') taskRefs.add(refId.toString());
        else if (refType === 'Team') teamRefs.add(refId.toString());
        else if (refType === 'User') userRefs.add(refId.toString());
      }
    }
  }
  
  // Fetch all references in batch
  const [tasks, teams, users] = await Promise.all([
    taskRefs.size > 0 ? Task.find({ _id: { $in: Array.from(taskRefs) } }).select('title status priority dueDate').lean() : [],
    teamRefs.size > 0 ? Team.find({ _id: { $in: Array.from(teamRefs) } }).select('name').lean() : [],
    userRefs.size > 0 ? User.find({ _id: { $in: Array.from(userRefs) } }).select('name email avatar').lean() : [],
  ]);
  
  // Create lookup maps for quick reference
  const tasksMap: Record<string, any> = {};
  const teamsMap: Record<string, any> = {};
  const usersMap: Record<string, any> = {};
  
  // Populate maps manually instead of using reduce
  tasks.forEach(task => {
    tasksMap[task._id.toString()] = task;
  });
  
  teams.forEach(team => {
    teamsMap[team._id.toString()] = team;
  });
  
  users.forEach(user => {
    usersMap[user._id.toString()] = user;
  });
  
  // Add populated references to notifications
  return notifications.map(notification => {
    const result = { ...notification };
    
    // Populate main reference
    if (notification.reference) {
      const { refType, refId } = notification.reference;
      const refIdStr = refId.toString();
      
      result.populatedReference = {
        refType,
        refId,
        data: refType === 'Task' ? tasksMap[refIdStr] :
              refType === 'Team' ? teamsMap[refIdStr] :
              refType === 'User' ? usersMap[refIdStr] : null
      };
    }
    
    // Populate related references
    if (notification.relatedRefs && notification.relatedRefs.length) {
      result.populatedRelatedRefs = notification.relatedRefs.map(ref => {
        const { refType, refId } = ref;
        const refIdStr = refId.toString();
        
        return {
          refType,
          refId,
          data: refType === 'Task' ? tasksMap[refIdStr] :
                refType === 'Team' ? teamsMap[refIdStr] :
                refType === 'User' ? usersMap[refIdStr] : null
        };
      });
    }
    
    return result;
  });
}

export default {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationCount,
  generateTestNotification,
}; 