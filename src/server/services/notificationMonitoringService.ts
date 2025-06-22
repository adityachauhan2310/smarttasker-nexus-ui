import { Task } from '../models';
import notificationService from './notificationService';

// Define intervals in ms
const CHECK_INTERVAL_MS = 15 * 60 * 1000; // Check every 15 minutes
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

let monitorInterval: NodeJS.Timeout | null = null;

/**
 * Start the notification monitoring service
 * This service periodically checks for:
 * 1. Tasks that are due soon (1 day before)
 * 2. Tasks that are overdue
 */
export const startNotificationMonitoring = (): void => {
  if (monitorInterval) {
    console.log('Task notification monitoring is already running');
    return;
  }

  console.log('Starting notification monitoring service');

  // Run immediately on startup
  monitorTaskDueDates().catch(err => {
    console.error('Error in initial task due date monitoring:', err);
  });

  // Set up interval to run regularly
  monitorInterval = setInterval(() => {
    monitorTaskDueDates().catch(err => {
      console.error('Error in task notification monitoring:', err);
    });
  }, CHECK_INTERVAL_MS);
};

/**
 * Stop the notification monitoring service
 */
export const stopNotificationMonitoring = (): void => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('Task notification monitoring stopped');
  }
};

/**
 * Monitor tasks for upcoming due dates and overdue tasks
 */
export const monitorTaskDueDates = async (): Promise<void> => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Running task notification monitoring`);

  try {
    // Current time to compare against
    const now = new Date();
    
    // Check for tasks due in approximately 1 day
    const tomorrow = new Date(now.getTime() + ONE_DAY_MS);
    await checkTasksDueSoon(now, tomorrow);
    
    // Check for overdue tasks (tasks due in the past but not completed)
    await checkOverdueTasks(now);

    const duration = Date.now() - startTime;
    console.log(`Task notification monitoring completed in ${duration}ms`);
  } catch (error) {
    console.error('Error in monitorTaskDueDates:', error);
  }
};

/**
 * Check for tasks that are due soon and send notifications
 */
async function checkTasksDueSoon(now: Date, targetTime: Date): Promise<void> {
  try {
    const nowStr = now.toISOString();
    const targetTimeStr = targetTime.toISOString();
    const oneDayAgoStr = new Date(now.getTime() - ONE_DAY_MS).toISOString();
    
    // Find tasks due soon
    const { data: dueSoonTasks, error } = await Task.findDueSoon(nowStr, targetTimeStr, oneDayAgoStr);
    
    if (error) {
      console.error('Error querying due soon tasks:', error);
      return;
    }

    console.log(`Found ${dueSoonTasks?.length || 0} tasks due soon`);

    for (const task of dueSoonTasks || []) {
      try {
        // Skip if there's no assigned user
        if (!task.assigned_to) continue;
        
        // Get user details (needed for notifications)
        const { data: assignedUser } = await Task.getUserDetails(task.assigned_to);
        if (!assignedUser) continue;
        
        // Send notification
        await notificationService.notifyTaskDue(
          task.assigned_to,
          task.id,
          task.title,
          task.due_date
        );
        
        // Update task to record notification sent
        const notificationsSent = task.notifications_sent || {};
        notificationsSent.due_soon = new Date().toISOString();
        
        await Task.update(task.id, {
          notifications_sent: notificationsSent
        });
        
        console.log(`Sent due soon notification for task ${task.id} to user ${task.assigned_to}`);
      } catch (taskError) {
        console.error(`Error sending notification for task ${task.id}:`, taskError);
      }
    }
  } catch (error) {
    console.error('Error checking tasks due soon:', error);
  }
}

/**
 * Check for tasks that are overdue and send notifications
 */
async function checkOverdueTasks(now: Date): Promise<void> {
  try {
    const nowStr = now.toISOString();
    const oneDayAgoStr = new Date(now.getTime() - ONE_DAY_MS).toISOString();
    
    // Find overdue tasks
    const { data: overdueTasks, error } = await Task.findOverdue(nowStr, oneDayAgoStr);
    
    if (error) {
      console.error('Error querying overdue tasks:', error);
      return;
    }

    console.log(`Found ${overdueTasks?.length || 0} overdue tasks`);

    for (const task of overdueTasks || []) {
      try {
        // Skip if there's no assigned user
        if (!task.assigned_to) continue;
        
        // Get user details (needed for notifications)
        const { data: assignedUser } = await Task.getUserDetails(task.assigned_to);
        if (!assignedUser) continue;
        
        // Calculate how overdue the task is
        const taskDueDate = new Date(task.due_date);
        const overdueDuration = now.getTime() - taskDueDate.getTime();
        
        // For very overdue tasks (>1 day), use a higher priority notification
        if (overdueDuration > ONE_DAY_MS) {
          await notificationService.notifyTaskOverdue(
            task.assigned_to,
            task.id,
            task.title,
            task.due_date
          );
        }
        
        // Update task to record notification sent
        const notificationsSent = task.notifications_sent || {};
        notificationsSent.overdue = new Date().toISOString();
        
        await Task.update(task.id, {
          notifications_sent: notificationsSent
        });
        
        console.log(`Sent overdue notification for task ${task.id} to user ${task.assigned_to}`);
      } catch (taskError) {
        console.error(`Error sending overdue notification for task ${task.id}:`, taskError);
      }
    }
  } catch (error) {
    console.error('Error checking overdue tasks:', error);
  }
}

export default {
  startNotificationMonitoring,
  stopNotificationMonitoring,
  monitorTaskDueDates,
}; 