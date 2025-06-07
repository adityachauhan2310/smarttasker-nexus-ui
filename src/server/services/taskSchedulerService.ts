import { RecurringTask } from '../models';
import { generateTasksForRecurringPattern } from '../controllers/recurringTaskController';

/**
 * Task Scheduler Service
 * 
 * This service is responsible for:
 * 1. Running the scheduled task generator
 * 2. Processing recurring tasks that are due for generation
 * 3. Managing the scheduling lifecycle
 */

let schedulerInterval: NodeJS.Timeout | null = null;
const SCHEDULER_INTERVAL_MINUTES = 15; // How often to check for tasks to generate

/**
 * Start the task scheduler service
 */
export const startTaskScheduler = (): void => {
  if (schedulerInterval) {
    console.log('Task scheduler is already running');
    return;
  }

  console.log('Starting task scheduler service');

  // Run the scheduler immediately on startup
  processRecurringTasks().catch(err => {
    console.error('Error in initial task scheduler run:', err);
  });

  // Set up interval to run regularly
  schedulerInterval = setInterval(() => {
    processRecurringTasks().catch(err => {
      console.error('Error in task scheduler:', err);
    });
  }, SCHEDULER_INTERVAL_MINUTES * 60 * 1000); // Convert minutes to milliseconds
};

/**
 * Stop the task scheduler service
 */
export const stopTaskScheduler = (): void => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Task scheduler service stopped');
  }
};

/**
 * Process all recurring tasks that need to generate new tasks
 */
export const processRecurringTasks = async (): Promise<void> => {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Running recurring task processor`);

  try {
    // Get all active recurring tasks where nextGenerationDate is in the past
    const now = new Date();
    const recurringTasksToProcess = await RecurringTask.find({
      paused: false,
      nextGenerationDate: { $lte: now }
    });

    console.log(`Found ${recurringTasksToProcess.length} recurring tasks to process`);

    // Process each task
    for (const recurringTask of recurringTasksToProcess) {
      try {
        const tasks = await generateTasksForRecurringPattern(recurringTask);
        console.log(
          `Generated ${tasks.length} task(s) for recurring pattern "${recurringTask.title}" (ID: ${recurringTask._id})`
        );
      } catch (taskError) {
        console.error(`Error generating tasks for recurring pattern ${recurringTask._id}:`, taskError);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Recurring task processor completed in ${duration}ms`);
  } catch (error) {
    console.error('Error in processRecurringTasks:', error);
  }
};

/**
 * Run a maintenance check on all recurring tasks
 * - Update nextGenerationDate for any tasks without one
 * - Check for tasks that have reached their end date or maxOccurrences
 * - Clean up any inconsistencies
 */
export const runRecurringTaskMaintenance = async (): Promise<void> => {
  console.log(`[${new Date().toISOString()}] Running recurring task maintenance`);
  
  try {
    // Find tasks with missing next generation date
    const tasksWithoutNextDate = await RecurringTask.find({
      paused: false,
      nextGenerationDate: { $exists: false }
    });
    
    console.log(`Found ${tasksWithoutNextDate.length} tasks with missing next generation date`);
    
    // Fix tasks without next generation date
    for (const task of tasksWithoutNextDate) {
      task.nextGenerationDate = task.calculateNextOccurrence();
      await task.save();
      console.log(`Updated nextGenerationDate for task ${task._id}`);
    }
    
    // Check for tasks that have reached their maxOccurrences
    const tasksWithLimits = await RecurringTask.find({
      paused: false,
      maxOccurrences: { $exists: true, $ne: null }
    });
    
    for (const task of tasksWithLimits) {
      if (task.tasksGenerated >= (task.maxOccurrences || 0)) {
        task.paused = true;
        await task.save();
        console.log(`Paused task ${task._id} as it reached maximum occurrences (${task.maxOccurrences})`);
      }
    }
    
    // Check for tasks that have passed their end date
    const tasksWithEndDate = await RecurringTask.find({
      paused: false,
      endDate: { $exists: true, $lt: new Date() }
    });
    
    for (const task of tasksWithEndDate) {
      task.paused = true;
      await task.save();
      console.log(`Paused task ${task._id} as it passed its end date (${task.endDate})`);
    }
    
    console.log('Recurring task maintenance completed');
  } catch (error) {
    console.error('Error in runRecurringTaskMaintenance:', error);
  }
};

export default {
  startTaskScheduler,
  stopTaskScheduler,
  processRecurringTasks,
  runRecurringTaskMaintenance
}; 