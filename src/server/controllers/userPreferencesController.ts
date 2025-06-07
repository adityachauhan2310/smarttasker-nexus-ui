import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models';
import { ErrorResponse } from '../middleware/errorMiddleware';

/**
 * @desc    Get user notification preferences
 * @route   GET /api/users/preferences/notifications
 * @access  Private
 */
export const getNotificationPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).select('notificationPreferences');

    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }

    // Initialize default preferences if not set
    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        emailDisabled: [],
        inAppDisabled: [],
        workingHours: {
          start: '09:00',
          end: '17:00',
          timezone: 'UTC',
          enabledDays: [1, 2, 3, 4, 5], // Monday to Friday
        },
      };
    }

    res.status(200).json({
      success: true,
      data: user.notificationPreferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user notification preferences
 * @route   PUT /api/users/preferences/notifications
 * @access  Private
 */
export const updateNotificationPreferences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Validate input
    await body('emailDisabled').optional().isArray().withMessage('emailDisabled should be an array').run(req);
    await body('inAppDisabled').optional().isArray().withMessage('inAppDisabled should be an array').run(req);
    await body('workingHours.start')
      .optional()
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Working hours start time should be in HH:MM format')
      .run(req);
    await body('workingHours.end')
      .optional()
      .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Working hours end time should be in HH:MM format')
      .run(req);
    await body('workingHours.timezone')
      .optional()
      .isString()
      .withMessage('Timezone should be a valid timezone string')
      .run(req);
    await body('workingHours.enabledDays')
      .optional()
      .isArray({ min: 0, max: 7 })
      .withMessage('enabledDays should be an array of 0-6 (days of week)')
      .run(req);
    await body('workingHours.enabledDays.*')
      .optional()
      .isInt({ min: 0, max: 6 })
      .withMessage('Each day must be between 0 (Sunday) and 6 (Saturday)')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Find user
    const user = await User.findById(req.user!._id);

    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }

    // Initialize notification preferences if they don't exist
    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }

    // Update email preferences
    if (req.body.emailDisabled !== undefined) {
      user.notificationPreferences.emailDisabled = req.body.emailDisabled;
    }

    // Update in-app notification preferences
    if (req.body.inAppDisabled !== undefined) {
      user.notificationPreferences.inAppDisabled = req.body.inAppDisabled;
    }

    // Update working hours
    if (req.body.workingHours) {
      if (!user.notificationPreferences.workingHours) {
        user.notificationPreferences.workingHours = {
          start: '09:00',
          end: '17:00',
          timezone: 'UTC',
          enabledDays: [1, 2, 3, 4, 5],
        };
      }

      // Update specific working hour properties
      if (req.body.workingHours.start !== undefined) {
        user.notificationPreferences.workingHours.start = req.body.workingHours.start;
      }

      if (req.body.workingHours.end !== undefined) {
        user.notificationPreferences.workingHours.end = req.body.workingHours.end;
      }

      if (req.body.workingHours.timezone !== undefined) {
        user.notificationPreferences.workingHours.timezone = req.body.workingHours.timezone;
      }

      if (req.body.workingHours.enabledDays !== undefined) {
        user.notificationPreferences.workingHours.enabledDays = req.body.workingHours.enabledDays;
      }
    }

    // Save updated user
    await user.save();

    res.status(200).json({
      success: true,
      data: user.notificationPreferences,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle mute for a specific notification type
 * @route   PUT /api/users/preferences/notifications/toggle-mute/:type/:channel
 * @access  Private
 */
export const toggleNotificationMute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, channel } = req.params;

    // Validate channel
    if (channel !== 'email' && channel !== 'inApp') {
      next(new ErrorResponse('Invalid channel. Must be "email" or "inApp"', 400));
      return;
    }

    // Validate notification type
    const validTypes = [
      'TaskAssigned',
      'TaskDue',
      'TaskOverdue',
      'MentionedInComment',
      'TeamChanged',
      'RecurringTaskGenerated',
      'TeamMemberAdded',
      'TeamMemberRemoved',
      'TeamLeaderChanged',
    ];

    if (!validTypes.includes(type)) {
      next(new ErrorResponse(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`, 400));
      return;
    }

    // Find user
    const user = await User.findById(req.user!._id);

    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }

    // Initialize notification preferences if they don't exist
    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        emailDisabled: [],
        inAppDisabled: [],
      };
    }

    // Determine which array to modify
    const arrayName = channel === 'email' ? 'emailDisabled' : 'inAppDisabled';
    
    // Initialize array if it doesn't exist
    if (!user.notificationPreferences[arrayName]) {
      user.notificationPreferences[arrayName] = [];
    }

    // Check if the type is already in the array
    const index = user.notificationPreferences[arrayName]!.indexOf(type);
    const wasMuted = index !== -1;

    if (wasMuted) {
      // If already muted, unmute it
      user.notificationPreferences[arrayName]!.splice(index, 1);
    } else {
      // If not muted, mute it
      user.notificationPreferences[arrayName]!.push(type);
    }

    // Save the updated user
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        type,
        channel,
        muted: !wasMuted,
        preferences: user.notificationPreferences,
      },
      message: `${type} notifications via ${channel} ${wasMuted ? 'unmuted' : 'muted'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getNotificationPreferences,
  updateNotificationPreferences,
  toggleNotificationMute,
}; 