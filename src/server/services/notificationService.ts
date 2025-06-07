import mongoose from 'mongoose';
import { Notification, INotification, NotificationType, NotificationPriority } from '../models/Notification';
import { User } from '../models';
import { sendEmail } from './emailService';
import { clearEntityCache } from '../middleware/cacheMiddleware';

// Interface for creating a new notification
interface CreateNotificationOptions {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  reference?: {
    refType: 'Task' | 'Team' | 'User' | 'Comment' | 'RecurringTask';
    refId: mongoose.Types.ObjectId;
  };
  relatedRefs?: {
    refType: 'Task' | 'Team' | 'User' | 'Comment' | 'RecurringTask';
    refId: mongoose.Types.ObjectId;
  }[];
  data?: Record<string, any>;
  sendEmail?: boolean;
}

/**
 * Create a new notification for a user
 */
export const createNotification = async (options: CreateNotificationOptions): Promise<INotification | null> => {
  try {
    const {
      user,
      type,
      title,
      message,
      priority = 'normal',
      reference,
      relatedRefs,
      data,
      sendEmail: shouldSendEmail = false,
    } = options;

    // Create notification
    const notification = new Notification({
      user,
      type,
      title,
      message,
      priority,
      reference,
      relatedRefs,
      data,
      read: false,
      emailSent: false,
    });

    // Save to database
    await notification.save();

    // Clear the cache for user's notifications
    clearEntityCache('notifications');
    clearEntityCache('userNotifications');
    clearEntityCache('notificationCount');

    // Send email if requested
    if (shouldSendEmail) {
      // Queue email sending to avoid blocking
      queueEmail(notification).catch(err => {
        console.error(`Failed to queue email for notification ${notification._id}:`, err);
      });
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create notification for task assignment
 */
export const notifyTaskAssigned = async (
  userId: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId,
  taskTitle: string,
  assignedByUserId: mongoose.Types.ObjectId
): Promise<void> => {
  try {
    await createNotification({
      user: userId,
      type: 'TaskAssigned',
      title: 'Task Assigned',
      message: `You have been assigned a new task: ${taskTitle}`,
      priority: 'normal',
      reference: {
        refType: 'Task',
        refId: taskId,
      },
      relatedRefs: [
        {
          refType: 'User',
          refId: assignedByUserId,
        },
      ],
      data: {
        taskTitle,
      },
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending task assigned notification:', error);
  }
};

/**
 * Create notification for task due soon
 */
export const notifyTaskDue = async (
  userId: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId,
  taskTitle: string,
  dueDate: Date
): Promise<void> => {
  try {
    await createNotification({
      user: userId,
      type: 'TaskDue',
      title: 'Task Due Soon',
      message: `Task "${taskTitle}" is due soon`,
      priority: 'high',
      reference: {
        refType: 'Task',
        refId: taskId,
      },
      data: {
        taskTitle,
        dueDate,
      },
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending task due notification:', error);
  }
};

/**
 * Create notification for task overdue
 */
export const notifyTaskOverdue = async (
  userId: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId,
  taskTitle: string,
  dueDate: Date
): Promise<void> => {
  try {
    await createNotification({
      user: userId,
      type: 'TaskOverdue',
      title: 'Task Overdue',
      message: `Task "${taskTitle}" is now overdue`,
      priority: 'urgent',
      reference: {
        refType: 'Task',
        refId: taskId,
      },
      data: {
        taskTitle,
        dueDate,
      },
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending task overdue notification:', error);
  }
};

/**
 * Create notification for mention in comment
 */
export const notifyMentionedInComment = async (
  userId: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId,
  commentId: mongoose.Types.ObjectId,
  mentionedByUserId: mongoose.Types.ObjectId,
  taskTitle: string,
  commentText: string
): Promise<void> => {
  try {
    await createNotification({
      user: userId,
      type: 'MentionedInComment',
      title: 'Mentioned in Comment',
      message: `You were mentioned in a comment on task "${taskTitle}"`,
      priority: 'normal',
      reference: {
        refType: 'Task',
        refId: taskId,
      },
      relatedRefs: [
        {
          refType: 'User',
          refId: mentionedByUserId,
        },
        {
          refType: 'Comment',
          refId: commentId,
        },
      ],
      data: {
        taskTitle,
        commentText,
      },
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending mentioned in comment notification:', error);
  }
};

/**
 * Create notification for team change
 */
export const notifyTeamChanged = async (
  userId: mongoose.Types.ObjectId,
  teamId: mongoose.Types.ObjectId,
  teamName: string,
  changeType: 'added' | 'removed' | 'leader_changed'
): Promise<void> => {
  let title: string;
  let message: string;
  let type: NotificationType;

  switch (changeType) {
    case 'added':
      title = 'Added to Team';
      message = `You have been added to team "${teamName}"`;
      type = 'TeamMemberAdded';
      break;
    case 'removed':
      title = 'Removed from Team';
      message = `You have been removed from team "${teamName}"`;
      type = 'TeamMemberRemoved';
      break;
    case 'leader_changed':
      title = 'Team Leadership Changed';
      message = `You are now the leader of team "${teamName}"`;
      type = 'TeamLeaderChanged';
      break;
  }

  try {
    await createNotification({
      user: userId,
      type,
      title,
      message,
      priority: 'normal',
      reference: {
        refType: 'Team',
        refId: teamId,
      },
      data: {
        teamName,
        changeType,
      },
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending team changed notification:', error);
  }
};

/**
 * Create notification for recurring task generated
 */
export const notifyRecurringTaskGenerated = async (
  userId: mongoose.Types.ObjectId,
  recurringTaskId: mongoose.Types.ObjectId,
  taskId: mongoose.Types.ObjectId,
  recurringTaskTitle: string,
  taskTitle: string
): Promise<void> => {
  try {
    await createNotification({
      user: userId,
      type: 'RecurringTaskGenerated',
      title: 'New Recurring Task',
      message: `A new task was generated from recurring pattern "${recurringTaskTitle}"`,
      priority: 'normal',
      reference: {
        refType: 'Task',
        refId: taskId,
      },
      relatedRefs: [
        {
          refType: 'RecurringTask',
          refId: recurringTaskId,
        },
      ],
      data: {
        recurringTaskTitle,
        taskTitle,
      },
      sendEmail: false, // Often don't need email for recurring tasks
    });
  } catch (error) {
    console.error('Error sending recurring task notification:', error);
  }
};

/**
 * Queue email notifications for processing
 */
async function queueEmail(notification: INotification): Promise<void> {
  try {
    // Don't send emails for notifications that were already sent
    if (notification.emailSent) {
      return;
    }

    // Get user to check notification preferences
    const user = await User.findById(notification.user);
    
    if (!user || !user.email) {
      console.log(`Cannot send email to user ${notification.user}: User not found or no email`);
      return;
    }
    
    // Check if user has opted out of this notification type
    if (user.notificationPreferences && 
        user.notificationPreferences.emailDisabled &&
        user.notificationPreferences.emailDisabled.includes(notification.type)) {
      console.log(`User ${user._id} has opted out of email notifications for ${notification.type}`);
      return;
    }

    // Prepare email content based on notification type
    const emailContent = await prepareEmailContent(notification);
    
    if (!emailContent) {
      console.log(`Cannot prepare email for notification type: ${notification.type}`);
      return;
    }

    // Send the email
    await sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    // Mark notification as emailed
    notification.emailSent = true;
    notification.emailSentAt = new Date();
    await notification.save();

  } catch (error) {
    console.error('Error queueing email notification:', error);
    // In production, implement retry logic here
  }
}

/**
 * Prepare email content based on notification type
 */
async function prepareEmailContent(notification: INotification): Promise<{ subject: string; html: string } | null> {
  // In a real implementation, you would use a template engine like Handlebars
  // For this example, we'll create simple HTML content
  
  let subject = '';
  let content = '';
  
  switch (notification.type) {
    case 'TaskAssigned':
      subject = 'New Task Assigned';
      content = `
        <h2>New Task Assigned</h2>
        <p>You have been assigned a new task: <strong>${notification.data?.taskTitle || 'Untitled Task'}</strong></p>
        <p>${notification.message}</p>
        <p><a href="{{taskUrl}}">View Task</a></p>
      `;
      break;
      
    case 'TaskDue':
      subject = 'Task Due Soon';
      content = `
        <h2>Task Due Soon</h2>
        <p>The following task is due soon: <strong>${notification.data?.taskTitle || 'Untitled Task'}</strong></p>
        <p>${notification.message}</p>
        <p><a href="{{taskUrl}}">View Task</a></p>
      `;
      break;
      
    case 'TaskOverdue':
      subject = 'Task Overdue';
      content = `
        <h2>Task Overdue</h2>
        <p>The following task is overdue: <strong>${notification.data?.taskTitle || 'Untitled Task'}</strong></p>
        <p>${notification.message}</p>
        <p><a href="{{taskUrl}}">View Task</a></p>
      `;
      break;
      
    case 'MentionedInComment':
      subject = 'You Were Mentioned in a Comment';
      content = `
        <h2>Mentioned in Comment</h2>
        <p>You were mentioned in a comment on task: <strong>${notification.data?.taskTitle || 'Untitled Task'}</strong></p>
        <p>Comment: "${notification.data?.commentText || ''}"</p>
        <p><a href="{{taskUrl}}">View Task</a></p>
      `;
      break;
      
    case 'TeamMemberAdded':
    case 'TeamMemberRemoved':
    case 'TeamLeaderChanged':
      subject = 'Team Update';
      content = `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
        <p><a href="{{teamUrl}}">View Team</a></p>
      `;
      break;
      
    default:
      subject = notification.title;
      content = `
        <h2>${notification.title}</h2>
        <p>${notification.message}</p>
      `;
  }
  
  // For a full implementation, replace placeholders with real URLs
  const html = content
    .replace(/{{taskUrl}}/g, `http://localhost:3000/tasks/${notification.reference?.refId}`)
    .replace(/{{teamUrl}}/g, `http://localhost:3000/teams/${notification.reference?.refId}`);
  
  return { subject, html };
}

export default {
  createNotification,
  notifyTaskAssigned,
  notifyTaskDue,
  notifyTaskOverdue,
  notifyMentionedInComment,
  notifyTeamChanged,
  notifyRecurringTaskGenerated,
}; 