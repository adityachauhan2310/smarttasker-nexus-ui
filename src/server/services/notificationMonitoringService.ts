import mongoose from 'mongoose';
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
    // The time window we're checking (between now and targetTime)
    const dueSoonTasks = await Task.find({
      status: { $ne: 'completed' },
      dueDate: {
        $gt: now,
        $lte: targetTime
      },
      // Only find tasks where we haven't sent a notification in the past day
      $or: [
        { 'notificationsSent.dueSoon': { $exists: false } },
        { 'notificationsSent.dueSoon': { $lt: new Date(now.getTime() - ONE_DAY_MS) } }
      ]
    }).populate('assignedTo', '_id name email');

    console.log(`Found ${dueSoonTasks.length} tasks due soon`);

    for (const task of dueSoonTasks) {
      try {
        // Skip if there's no assigned user
        if (!task.assignedTo) continue;
        
        const assignedUser = task.assignedTo as any; // Using any due to population complexity
        
        // Send notification
        await notificationService.notifyTaskDue(
          assignedUser._id,
          task._id,
          task.title,
          task.dueDate
        );
        
        // Update task to record notification sent
        task.notificationsSent = task.notificationsSent || {};
        task.notificationsSent.dueSoon = new Date();
        await task.save();
        
        console.log(`Sent due soon notification for task ${task._id} to user ${assignedUser._id}`);
      } catch (taskError) {
        console.error(`Error sending notification for task ${task._id}:`, taskError);
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
    // Find tasks that are overdue
    const overdueTasks = await Task.find({
      status: { $ne: 'completed' },
      dueDate: { $lt: now },
      // Only find tasks where we haven't sent an overdue notification in the past day
      $or: [
        { 'notificationsSent.overdue': { $exists: false } },
        { 'notificationsSent.overdue': { $lt: new Date(now.getTime() - ONE_DAY_MS) } }
      ]
    }).populate('assignedTo', '_id name email');

    console.log(`Found ${overdueTasks.length} overdue tasks`);

    for (const task of overdueTasks) {
      try {
        // Skip if there's no assigned user
        if (!task.assignedTo) continue;
        
        const assignedUser = task.assignedTo as any; // Using any due to population complexity
        
        // Calculate how overdue the task is
        const overdueDuration = now.getTime() - task.dueDate.getTime();
        
        // For very overdue tasks (>1 day), use a higher priority notification
        if (overdueDuration > ONE_DAY_MS) {
          // Send notification
          await notificationService.notifyTaskOverdue(
            assignedUser._id,
            task._id,
            task.title,
            task.dueDate
          );
        }
        
        // Update task to record notification sent
        task.notificationsSent = task.notificationsSent || {};
        task.notificationsSent.overdue = new Date();
        await task.save();
        
        console.log(`Sent overdue notification for task ${task._id} to user ${assignedUser._id}`);
      } catch (taskError) {
        console.error(`Error sending overdue notification for task ${task._id}:`, taskError);
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