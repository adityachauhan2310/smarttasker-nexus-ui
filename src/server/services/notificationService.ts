import { 
  Notification,
  INotification, 
  NotificationType, 
  NotificationPriority,
  INotificationReference,
  ReferenceType
} from '../models/Notification';
import { sendEmail } from './emailService';

// Interface for creating a new notification
interface CreateNotificationOptions {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  reference?: {
    ref_type: ReferenceType;
    ref_id: string;
  };
  related_refs?: {
    ref_type: ReferenceType;
    ref_id: string;
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
      user_id,
      type,
      title,
      message,
      priority = 'normal',
      reference,
      related_refs,
      data,
      sendEmail: shouldSendEmail = false,
    } = options;

    // Create notification using the Notification model class
    const notification = await Notification.create({
      user_id,
      type,
      title,
      message,
      priority,
      reference,
      related_refs,
      data,
      read: false,
      email_sent: false
    });

    if (!notification) {
      throw new Error('Failed to create notification');
    }

    // Send email if requested
    if (shouldSendEmail) {
      // Queue email sending to avoid blocking
      queueEmail(notification).catch(err => {
        console.error(`Failed to queue email for notification ${notification.id}:`, err);
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
  userId: string,
  taskId: string,
  taskTitle: string,
  assignedByUserId: string
): Promise<void> => {
  try {
    await createNotification({
      user_id: userId,
      type: 'TaskAssigned',
      title: 'Task Assigned',
      message: `You have been assigned a new task: ${taskTitle}`,
      priority: 'normal',
      reference: {
        ref_type: 'Task',
        ref_id: taskId,
      },
      related_refs: [
        {
          ref_type: 'User',
          ref_id: assignedByUserId,
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
  userId: string,
  taskId: string,
  taskTitle: string,
  dueDate: string
): Promise<void> => {
  try {
    await createNotification({
      user_id: userId,
      type: 'TaskDue',
      title: 'Task Due Soon',
      message: `Task "${taskTitle}" is due soon`,
      priority: 'high',
      reference: {
        ref_type: 'Task',
        ref_id: taskId,
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
  userId: string,
  taskId: string,
  taskTitle: string,
  dueDate: string
): Promise<void> => {
  try {
    await createNotification({
      user_id: userId,
      type: 'TaskOverdue',
      title: 'Task Overdue',
      message: `Task "${taskTitle}" is now overdue`,
      priority: 'urgent',
      reference: {
        ref_type: 'Task',
        ref_id: taskId,
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
  userId: string,
  taskId: string,
  commentId: string,
  mentionedByUserId: string,
  taskTitle: string,
  commentText: string
): Promise<void> => {
  try {
    await createNotification({
      user_id: userId,
      type: 'MentionedInComment',
      title: 'Mentioned in Comment',
      message: `You were mentioned in a comment on task "${taskTitle}"`,
      priority: 'normal',
      reference: {
        ref_type: 'Task',
        ref_id: taskId,
      },
      related_refs: [
        {
          ref_type: 'User',
          ref_id: mentionedByUserId,
        },
        {
          ref_type: 'Comment',
          ref_id: commentId,
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
  userId: string,
  teamId: string,
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
      user_id: userId,
      type,
      title,
      message,
      priority: 'normal',
      reference: {
        ref_type: 'Team',
        ref_id: teamId,
      },
      data: {
        teamName,
        changeType,
      },
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending team change notification:', error);
  }
};

/**
 * Create notification for recurring task generated
 */
export const notifyRecurringTaskGenerated = async (
  userId: string,
  recurringTaskId: string,
  taskId: string,
  recurringTaskTitle: string,
  taskTitle: string
): Promise<void> => {
  try {
    await createNotification({
      user_id: userId,
      type: 'RecurringTaskGenerated',
      title: 'Recurring Task Generated',
      message: `A new task has been generated from your recurring task "${recurringTaskTitle}"`,
      priority: 'normal',
      reference: {
        ref_type: 'Task',
        ref_id: taskId,
      },
      related_refs: [
        {
          ref_type: 'RecurringTask',
          ref_id: recurringTaskId,
        },
      ],
      data: {
        recurringTaskTitle,
        taskTitle,
      },
      sendEmail: true,
    });
  } catch (error) {
    console.error('Error sending recurring task generated notification:', error);
  }
};

/**
 * Queue email sending for a notification
 */
async function queueEmail(notification: INotification): Promise<void> {
  try {
    if (notification.email_sent) {
      console.log(`Email already sent for notification ${notification.id}`);
      return;
    }

    const emailContent = await prepareEmailContent(notification);
    if (!emailContent) {
      console.log(`No email content for notification ${notification.id}`);
      return;
    }

    // Send the email
    await sendEmail({
      to: '', // Need to fetch user's email
      subject: emailContent.subject,
      html: emailContent.html,
    });

    // Update the notification to mark email as sent
    await Notification.update(notification.id, {
      email_sent: true,
      email_sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`Error sending email for notification ${notification.id}:`, error);
  }
}

/**
 * Prepare email content for a notification
 */
async function prepareEmailContent(notification: INotification): Promise<{ subject: string; html: string } | null> {
  try {
    // Template customization based on notification type
    let subject = notification.title;
    let templateData: Record<string, any> = {
      title: notification.title,
      message: notification.message,
      notificationId: notification.id,
      timestamp: new Date(notification.created_at).toLocaleString(),
    };

    // Add notification specific data
    if (notification.data) {
      templateData = {
        ...templateData,
        ...notification.data,
      };
    }

    // Here you could use different templates based on notification type
    const html = `
      <h2>${notification.title}</h2>
      <p>${notification.message}</p>
      <hr />
      <p><small>This notification was sent at ${templateData.timestamp}</small></p>
    `;

    return {
      subject,
      html,
    };
  } catch (error) {
    console.error('Error preparing email content:', error);
    return null;
  }
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