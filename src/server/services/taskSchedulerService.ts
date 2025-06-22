import { RecurringTask, IRecurringTask } from '../models';
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
    // Get all active recurring tasks where next_generation_date is in the past
    const now = new Date().toISOString();
    const { data: recurringTasksToProcess, error } = await RecurringTask.findTasksForGeneration(now);

    if (error) {
      console.error('Error finding tasks to process:', error);
      return;
    }

    console.log(`Found ${recurringTasksToProcess?.length || 0} recurring tasks to process`);

    // Process each task
    for (const recurringTask of recurringTasksToProcess || []) {
      try {
        const tasks = await generateTasksForRecurringPattern(recurringTask);
        console.log(
          `Generated ${tasks.length} task(s) for recurring pattern "${recurringTask.title}" (ID: ${recurringTask.id})`
        );
      } catch (taskError) {
        console.error(`Error generating tasks for recurring pattern ${recurringTask.id}:`, taskError);
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
 * - Update next_generation_date for any tasks without one
 * - Check for tasks that have reached their end date or max_occurrences
 * - Clean up any inconsistencies
 */
export const runRecurringTaskMaintenance = async (): Promise<void> => {
  console.log(`[${new Date().toISOString()}] Running recurring task maintenance`);
  
  try {
    // Find tasks with missing next generation date
    const { data: tasksWithoutNextDate, error } = await RecurringTask.findTasksWithoutNextDate();
    
    if (error) {
      console.error('Error finding tasks without next generation date:', error);
      return;
    }
    
    console.log(`Found ${tasksWithoutNextDate?.length || 0} tasks with missing next generation date`);
    
    // Fix tasks without next generation date
    for (const task of tasksWithoutNextDate || []) {
      const nextDate = RecurringTask.calculateNextOccurrence(task);
      await RecurringTask.update(task.id, {
        next_generation_date: nextDate.toISOString()
      });
      console.log(`Updated next_generation_date for task ${task.id}`);
    }
    
    // Check for tasks that have reached their max_occurrences
    const { data: tasksWithLimits, error: limitsError } = await RecurringTask.findTasksWithLimits();
    
    if (limitsError) {
      console.error('Error finding tasks with limits:', limitsError);
      return;
    }
    
    for (const task of tasksWithLimits || []) {
      if (task.tasks_generated >= (task.max_occurrences || 0)) {
        await RecurringTask.update(task.id, { paused: true });
        console.log(`Paused task ${task.id} as it reached maximum occurrences (${task.max_occurrences})`);
      }
    }
    
    // Check for tasks that have passed their end date
    const now = new Date().toISOString();
    const { data: tasksWithEndDate, error: endDateError } = await RecurringTask.findTasksPastEndDate(now);
    
    if (endDateError) {
      console.error('Error finding tasks past end date:', endDateError);
      return;
    }
    
    for (const task of tasksWithEndDate || []) {
      await RecurringTask.update(task.id, { paused: true });
      console.log(`Paused task ${task.id} as it passed its end date (${task.end_date})`);
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