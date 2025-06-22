import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { body, query, param, validationResult } from 'express-validator';
import { RecurringTask, Task, IRecurringTask } from '../models';
import { ErrorResponse } from '../middleware/errorMiddleware';
import { clearEntityCache } from '../middleware/cacheMiddleware';

// Import the Request type with extended properties
import 'express';

/**
 * @desc    Get all recurring tasks with filtering
 * @route   GET /api/recurring-tasks
 * @access  Private
 */
export const getRecurringTasks = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Validate query parameters
    await query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer').run(req);
    await query('limit').optional().isInt({ min: 1, max: 50 }).toInt().withMessage('Limit must be between 1 and 50').run(req);
    await query('frequency').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid frequency').run(req);
    await query('filter').optional().isString().withMessage('Filter must be a string').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Pagination parameters
    const page: number = parseInt(req.query.page as string) || 1;
    const limit: number = parseInt(req.query.limit as string) || 20;
    const skip: number = (page - 1) * limit;

    // Filter parameter (if provided)
    const filterParam: string | undefined = req.query.filter as string | undefined;

    // Build filter object based on query params
    const filter: { [key: string]: any } = {};

    // Only show the user's own recurring tasks unless they're admin
    if (req.user && req.user.role !== 'admin') {
      // For team leader, show recurring tasks for their team
      if (req.user.role === 'team_leader') {
        filter.$or = [
          { createdBy: req.user._id },
          { teamId: req.user.teamId } // Assuming user has teamId field
        ];
      } else {
        // Regular users only see their own tasks
        filter.createdBy = req.user._id;
      }
    }

    // Filter by frequency if provided
    if (req.query.frequency) {
      filter.frequency = req.query.frequency;
    }

    // Filter by status (active/paused)
    if (req.query.status === 'active') {
      filter.paused = false;
    } else if (req.query.status === 'paused') {
      filter.paused = true;
    }

    // Search by title
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    // Get total count
    const filterObject = filter || {};
    const total: number = await RecurringTask.countDocuments(filterObject);

    // Get recurring tasks
    const recurringTasks = await RecurringTask
      .find(filterObject)
      .populate('createdBy', 'name email avatar')
      .populate('teamId', 'name')
      .populate('taskTemplate.assignedTo', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Return response
    res.status(200).json({
      success: true,
      count: recurringTasks.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: recurringTasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get recurring task by ID
 * @route   GET /api/recurring-tasks/:id
 * @access  Private
 */
export const getRecurringTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Get recurring task
    const recurringTask = await RecurringTask.findById(taskId)
      .populate('createdBy', 'name email avatar')
      .populate('teamId', 'name')
      .populate('taskTemplate.assignedTo', 'name email avatar');

    if (!recurringTask) {
      next(new ErrorResponse('Recurring task not found', 404));
      return;
    }

    // Check if user has access to this recurring task
    if (!await hasRecurringTaskAccess(req.user!, recurringTask)) {
      next(new ErrorResponse('Not authorized to access this recurring task', 403));
      return;
    }

    // Get the last few generated tasks from this pattern
    const generatedTasks = await Task.find({ 
      recurringTaskId: recurringTask._id 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('assignedTo', 'name email avatar');

    res.status(200).json({
      success: true,
      data: {
        recurringTask,
        generatedTasks
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new recurring task
 * @route   POST /api/recurring-tasks
 * @access  Private
 */
export const createRecurringTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    await Promise.all([
      body('title').trim().notEmpty().withMessage('Title is required').run(req),
      body('frequency').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Valid frequency is required').run(req),
      body('interval').isInt({ min: 1 }).withMessage('Interval must be a positive integer').run(req),
      body('startDate').optional().isISO8601().toDate().withMessage('Valid start date is required').run(req),
      body('endDate').optional().isISO8601().toDate().withMessage('Invalid end date format').run(req),
      body('taskTemplate.title').trim().notEmpty().withMessage('Task template title is required').run(req),
      body('taskTemplate.priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority').run(req),
    ]);

    // For weekly frequency, validate daysOfWeek
    if (req.body.frequency === 'weekly') {
      await body('daysOfWeek').isArray({ min: 1 }).withMessage('At least one day of week is required for weekly frequency').run(req);
      await body('daysOfWeek.*').isInt({ min: 0, max: 6 }).withMessage('Days must be between 0 (Sunday) and 6 (Saturday)').run(req);
    }

    // For monthly frequency, validate dayOfMonth
    if (req.body.frequency === 'monthly') {
      await body('dayOfMonth').isInt({ min: -1, max: 31 }).withMessage('Day of month must be between -1 (last day) and 31').run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Check if assignedTo user exists and is accessible
    if (req.body.taskTemplate && req.body.taskTemplate.assignedTo) {
      // Logic to check if the user can assign tasks to this user would go here
    }

    // Validate end date is after start date
    if (req.body.endDate && new Date(req.body.endDate) <= new Date(req.body.startDate || new Date())) {
      next(new ErrorResponse('End date must be after start date', 400));
      return;
    }

    // Create recurring task data with proper typing
    const recurringTaskData = {
      ...req.body,
      createdBy: req.user!._id,
      tasksGenerated: 0,
      paused: req.body.paused || false,
    };

    // Create the recurring task instance
    const recurringTask = new RecurringTask(recurringTaskData);
    
    // Calculate the next generation date
    recurringTask.nextGenerationDate = recurringTask.calculateNextOccurrence(new Date());

    // Save the recurring task
    await recurringTask.save();

    // Populate references
    await recurringTask.populate('createdBy', 'name email avatar');
    if (recurringTask.teamId) {
      await recurringTask.populate('teamId', 'name');
    }
    if (recurringTask.taskTemplate.assignedTo) {
      await recurringTask.populate('taskTemplate.assignedTo', 'name email avatar');
    }

    // Generate the first task immediately if not paused and start date is today or in the past
    const now = new Date();
    // Set hours, minutes, seconds and milliseconds individually
    now.setHours(0);
    now.setMinutes(0); 
    now.setSeconds(0);
    now.setMilliseconds(0);
    
    const startDate = new Date(recurringTask.startDate);
    // Set hours, minutes, seconds and milliseconds individually
    startDate.setHours(0);
    startDate.setMinutes(0);
    startDate.setSeconds(0);
    startDate.setMilliseconds(0);
    
    if (!recurringTask.paused && startDate <= now) {
      await generateTasksForRecurringPattern(recurringTask);
    }

    res.status(201).json({
      success: true,
      data: recurringTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update recurring task
 * @route   PUT /api/recurring-tasks/:id
 * @access  Private
 */
export const updateRecurringTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Find the recurring task
    const recurringTask = await RecurringTask.findById(taskId);

    if (!recurringTask) {
      next(new ErrorResponse('Recurring task not found', 404));
      return;
    }

    // Check if user has access to update this recurring task
    if (!await hasRecurringTaskUpdateAccess(req.user!, recurringTask)) {
      next(new ErrorResponse('Not authorized to update this recurring task', 403));
      return;
    }

    // Validate request body - only validate provided fields
    const validations = [];

    if (req.body.title !== undefined) {
      validations.push(body('title').trim().notEmpty().withMessage('Title is required').run(req));
    }

    if (req.body.frequency !== undefined) {
      validations.push(body('frequency').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Valid frequency is required').run(req));
    }

    if (req.body.interval !== undefined) {
      validations.push(body('interval').isInt({ min: 1 }).withMessage('Interval must be a positive integer').run(req));
    }

    if (req.body.startDate !== undefined) {
      validations.push(body('startDate').isISO8601().toDate().withMessage('Valid start date is required').run(req));
    }

    if (req.body.endDate !== undefined) {
      validations.push(body('endDate').isISO8601().toDate().withMessage('Invalid end date format').run(req));
    }

    if (req.body.taskTemplate && req.body.taskTemplate.title !== undefined) {
      validations.push(body('taskTemplate.title').trim().notEmpty().withMessage('Task template title is required').run(req));
    }

    if (req.body.taskTemplate && req.body.taskTemplate.priority !== undefined) {
      validations.push(body('taskTemplate.priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority').run(req));
    }

    // For weekly frequency, validate daysOfWeek if provided
    if (req.body.frequency === 'weekly' && req.body.daysOfWeek !== undefined) {
      validations.push(body('daysOfWeek').isArray({ min: 1 }).withMessage('At least one day of week is required for weekly frequency').run(req));
      validations.push(body('daysOfWeek.*').isInt({ min: 0, max: 6 }).withMessage('Days must be between 0 (Sunday) and 6 (Saturday)').run(req));
    }

    // For monthly frequency, validate dayOfMonth if provided
    if (req.body.frequency === 'monthly' && req.body.dayOfMonth !== undefined) {
      validations.push(body('dayOfMonth').isInt({ min: -1, max: 31 }).withMessage('Day of month must be between -1 (last day) and 31').run(req));
    }

    if (validations.length > 0) {
      await Promise.all(validations);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          errors: errors.array(),
        });
        return;
      }
    }

    // Validate end date is after start date if both are provided
    const startDate = req.body.startDate !== undefined ? new Date(req.body.startDate) : recurringTask.startDate;
    const endDate = req.body.endDate !== undefined ? req.body.endDate ? new Date(req.body.endDate) : null : recurringTask.endDate;
    
    if (endDate && startDate && endDate <= startDate) {
      next(new ErrorResponse('End date must be after start date', 400));
      return;
    }

    // Update fields
    const updateData = { ...req.body };

    // Keep some fields protected
    delete updateData.createdBy;
    delete updateData.tasksGenerated;
    delete updateData.lastGeneratedDate;

    // Update the recurring task
    const updatedTask = await RecurringTask.findByIdAndUpdate(
      taskId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
    .populate('createdBy', 'name email avatar')
    .populate('teamId', 'name')
    .populate('taskTemplate.assignedTo', 'name email avatar');

    // Recalculate next generation date if pattern changed
    if (updatedTask && (
      req.body.frequency !== undefined || 
      req.body.interval !== undefined || 
      req.body.daysOfWeek !== undefined ||
      req.body.dayOfMonth !== undefined ||
      req.body.startDate !== undefined ||
      req.body.endDate !== undefined ||
      req.body.skipDates !== undefined ||
      req.body.skipWeekends !== undefined ||
      req.body.skipHolidays !== undefined
    )) {
      updatedTask.nextGenerationDate = updatedTask.calculateNextOccurrence(new Date());
      await updatedTask.save();
    }

    // Clear related cache
    await clearEntityCache('recurringTask');

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete recurring task
 * @route   DELETE /api/recurring-tasks/:id
 * @access  Private
 */
export const deleteRecurringTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Find the recurring task
    const recurringTask = await RecurringTask.findById(taskId);

    if (!recurringTask) {
      next(new ErrorResponse('Recurring task not found', 404));
      return;
    }

    // Check if user has access to delete this recurring task
    if (!await hasRecurringTaskUpdateAccess(req.user!, recurringTask)) {
      next(new ErrorResponse('Not authorized to delete this recurring task', 403));
      return;
    }

    // Option to delete all generated tasks
    const deleteGeneratedTasks = req.query.deleteGenerated === 'true';

    if (deleteGeneratedTasks) {
      // Delete all tasks generated from this pattern
      await Task.deleteMany({ recurringTaskId: recurringTask._id });
    }

    // Delete the recurring task
    await recurringTask.deleteOne();

    // Clear related cache
    await clearEntityCache('recurringTask');

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Pause recurring task
 * @route   PUT /api/recurring-tasks/:id/pause
 * @access  Private
 */
export const pauseRecurringTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Find the recurring task
    const recurringTask = await RecurringTask.findById(taskId);

    if (!recurringTask) {
      next(new ErrorResponse('Recurring task not found', 404));
      return;
    }

    // Check if user has access to update this recurring task
    if (!await hasRecurringTaskUpdateAccess(req.user!, recurringTask)) {
      next(new ErrorResponse('Not authorized to update this recurring task', 403));
      return;
    }

    // Check if already paused
    if (recurringTask.paused) {
      return res.status(200).json({
        success: true,
        message: 'Recurring task is already paused',
        data: recurringTask,
      });
    }

    // Pause the recurring task
    recurringTask.paused = true;
    await recurringTask.save();

    // Clear related cache
    await clearEntityCache('recurringTask');

    res.status(200).json({
      success: true,
      message: 'Recurring task paused successfully',
      data: recurringTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resume recurring task
 * @route   PUT /api/recurring-tasks/:id/resume
 * @access  Private
 */
export const resumeRecurringTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Find the recurring task
    const recurringTask = await RecurringTask.findById(taskId);

    if (!recurringTask) {
      next(new ErrorResponse('Recurring task not found', 404));
      return;
    }

    // Check if user has access to update this recurring task
    if (!await hasRecurringTaskUpdateAccess(req.user!, recurringTask)) {
      next(new ErrorResponse('Not authorized to update this recurring task', 403));
      return;
    }

    // Check if already active
    if (!recurringTask.paused) {
      return res.status(200).json({
        success: true,
        message: 'Recurring task is already active',
        data: recurringTask,
      });
    }

    // Resume the recurring task
    await recurringTask.resume();

    // Check if we need to generate tasks immediately
    const now = new Date();
    if (recurringTask.nextGenerationDate && recurringTask.nextGenerationDate <= now) {
      await generateTasksForRecurringPattern(recurringTask);
    }

    // Clear related cache
    await clearEntityCache('recurringTask');

    res.status(200).json({
      success: true,
      message: 'Recurring task resumed successfully',
      data: recurringTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate tasks now for a recurring pattern
 * @route   POST /api/recurring-tasks/:id/generate
 * @access  Private
 */
export const generateTasksNow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Find the recurring task
    const recurringTask = await RecurringTask.findById(taskId);

    if (!recurringTask) {
      next(new ErrorResponse('Recurring task not found', 404));
      return;
    }

    // Check if user has access to manage this recurring task
    if (!await hasRecurringTaskUpdateAccess(req.user!, recurringTask)) {
      next(new ErrorResponse('Not authorized to manage this recurring task', 403));
      return;
    }

    // Check if the pattern is paused
    if (recurringTask.paused) {
      next(new ErrorResponse('Cannot generate tasks for a paused recurring pattern', 400));
      return;
    }

    // Get number of tasks to generate (default to 1)
    const count = parseInt(req.query.count as string) || 1;
    
    if (count < 1 || count > 10) {
      next(new ErrorResponse('Count must be between 1 and 10', 400));
      return;
    }

    // Generate tasks
    const generatedTasks = await generateTasksForRecurringPattern(recurringTask, count);

    res.status(200).json({
      success: true,
      message: `Successfully generated ${generatedTasks.length} tasks`,
      count: generatedTasks.length,
      data: generatedTasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get statistics for a recurring task
 * @route   GET /api/recurring-tasks/:id/stats
 * @access  Private
 */
export const getRecurringTaskStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Find the recurring task
    const recurringTask = await RecurringTask.findById(taskId);

    if (!recurringTask) {
      next(new ErrorResponse('Recurring task not found', 404));
      return;
    }

    // Check if user has access to view this recurring task
    if (!await hasRecurringTaskAccess(req.user!, recurringTask)) {
      next(new ErrorResponse('Not authorized to access this recurring task', 403));
      return;
    }

    // Get all tasks generated from this pattern
    const tasks = await Task.find({ recurringTaskId: recurringTask._id });
    
    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const pendingTasks = tasks.filter(task => task.status === 'pending').length;
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
    const overdueTasks = tasks.filter(task => 
      task.status !== 'completed' && task.dueDate && task.dueDate < new Date()
    ).length;
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate average completion time (for completed tasks)
    let totalCompletionTimeMs = 0;
    let tasksWithCompletionTime = 0;
    
    tasks.forEach(task => {
      if (task.status === 'completed' && task.completedAt) {
        const completionTime = task.completedAt.getTime() - task.createdAt.getTime();
        totalCompletionTimeMs += completionTime;
        tasksWithCompletionTime++;
      }
    });
    
    const avgCompletionTimeHours = tasksWithCompletionTime > 0 
      ? totalCompletionTimeMs / (tasksWithCompletionTime * 1000 * 60 * 60) 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        taskCounts: {
          total: totalTasks,
          completed: completedTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          overdue: overdueTasks,
        },
        metrics: {
          completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
          avgCompletionTimeHours: Math.round(avgCompletionTimeHours * 10) / 10, // Round to 1 decimal
          tasksGenerated: recurringTask.tasksGenerated,
          nextGenerationDate: recurringTask.nextGenerationDate,
        }
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Skip specific date for a recurring task
 * @route   POST /api/recurring-tasks/:id/skip-date
 * @access  Private
 */
export const addSkipDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Validate date
    await body('date').isISO8601().toDate().withMessage('Valid date is required').run(req);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Find the recurring task
    const recurringTask = await RecurringTask.findById(taskId);

    if (!recurringTask) {
      next(new ErrorResponse('Recurring task not found', 404));
      return;
    }

    // Check if user has access to update this recurring task
    if (!await hasRecurringTaskUpdateAccess(req.user!, recurringTask)) {
      next(new ErrorResponse('Not authorized to update this recurring task', 403));
      return;
    }

    // Format the date to remove time component for consistent comparison
    const skipDate = new Date(req.body.date);
    skipDate.setHours(0, 0, 0, 0);
    
    // Check if date is already in skip dates
    const dateExists = recurringTask.skipDates.some(date => {
      const existingDate = new Date(date);
      return existingDate.getFullYear() === skipDate.getFullYear() &&
        existingDate.getMonth() === skipDate.getMonth() &&
        existingDate.getDate() === skipDate.getDate();
    });
    
    if (dateExists) {
      return res.status(200).json({
        success: true,
        message: 'Date is already in skip dates',
        data: recurringTask,
      });
    }
    
    // Add date to skip dates
    recurringTask.skipDates.push(skipDate);
    await recurringTask.save();
    
    // Recalculate next generation date if it's affected
    if (recurringTask.nextGenerationDate) {
      const nextGenDate = new Date(recurringTask.nextGenerationDate);
      if (nextGenDate.getFullYear() === skipDate.getFullYear() &&
          nextGenDate.getMonth() === skipDate.getMonth() &&
          nextGenDate.getDate() === skipDate.getDate()) {
        recurringTask.nextGenerationDate = recurringTask.calculateNextOccurrence(skipDate);
        await recurringTask.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Skip date added successfully',
      data: recurringTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove skip date for a recurring task
 * @route   DELETE /api/recurring-tasks/:id/skip-date/:dateId
 * @access  Private
 */
export const removeSkipDate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const dateId = req.params.dateId;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Find the recurring task
    const recurringTask = await RecurringTask.findById(taskId);

    if (!recurringTask) {
      next(new ErrorResponse('Recurring task not found', 404));
      return;
    }

    // Check if user has access to update this recurring task
    if (!await hasRecurringTaskUpdateAccess(req.user!, recurringTask)) {
      next(new ErrorResponse('Not authorized to update this recurring task', 403));
      return;
    }

    // Remove the skip date
    recurringTask.skipDates = recurringTask.skipDates.filter(date => date.toString() !== dateId);
    await recurringTask.save();

    // Recalculate next generation date
    recurringTask.nextGenerationDate = recurringTask.calculateNextOccurrence();
    await recurringTask.save();

    res.status(200).json({
      success: true,
      message: 'Skip date removed successfully',
      data: recurringTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate tasks from a recurring task pattern
 * @param recurringTask The recurring task to generate from
 * @param count Number of occurrences to generate (default: 1)
 * @returns Array of created tasks
 */
export async function generateTasksForRecurringPattern(
  recurringTask: IRecurringTask,
  count: number = 1
): Promise<any[]> {
  try {
    // Keep track of created tasks
    const createdTasks = [];
    
    // Generate specified number of tasks
    for (let i = 0; i < count; i++) {
      // Skip if we've reached max occurrences
      if (recurringTask.max_occurrences && 
          recurringTask.tasks_generated >= recurringTask.max_occurrences) {
        console.log(`Skipping task generation - reached maximum occurrences (${recurringTask.max_occurrences})`);
        break;
      }
      
      // Calculate the occurrence date for this task
      let occurrenceDate = new Date();
      
      if (i === 0 && recurringTask.next_generation_date) {
        // Use the next generation date for the first task
        occurrenceDate = new Date(recurringTask.next_generation_date);
      } else {
        // Calculate occurrence date based on pattern
        occurrenceDate = RecurringTask.calculateNextOccurrence(recurringTask, occurrenceDate);
      }
      
      // Check if occurrence date is past the end date
      if (recurringTask.end_date && new Date(recurringTask.end_date) < occurrenceDate) {
        console.log(`Skipping task generation - occurrence date ${occurrenceDate.toISOString()} is past end date ${recurringTask.end_date}`);
        break;
      }
      
      // Generate task data for this occurrence
      const taskData = RecurringTask.generateTaskData(recurringTask, occurrenceDate);
      
      // Create the task
      const task = await Task.create(taskData);
      
      if (task) {
        createdTasks.push(task);
        
        // Update task count on the recurring task
        await RecurringTask.update(recurringTask.id, {
          tasks_generated: (recurringTask.tasks_generated || 0) + 1
        });
        
        // Update recurring task object to reflect this change
        recurringTask.tasks_generated = (recurringTask.tasks_generated || 0) + 1;
        
        // Send notification if needed
        if (taskData.assigned_to && taskData.assigned_to !== recurringTask.created_by) {
          try {
            // Import dynamically to avoid circular dependencies
            const { notifyRecurringTaskGenerated } = await import('../services/notificationService');
            await notifyRecurringTaskGenerated(
              taskData.assigned_to as string,
              recurringTask.id,
              task.id,
              recurringTask.title,
              task.title
            );
          } catch (notifyError) {
            console.error('Error sending notification:', notifyError);
          }
        }
      }
      
      // Update next generation date
      const nextDate = RecurringTask.calculateNextOccurrence(recurringTask, occurrenceDate);
      await RecurringTask.update(recurringTask.id, {
        next_generation_date: nextDate.toISOString()
      });
      
      // Update object to reflect the change
      recurringTask.next_generation_date = nextDate.toISOString();
    }
    
    return createdTasks;
  } catch (error) {
    console.error('Error generating tasks from recurring pattern:', error);
    return [];
  }
}

/**
 * Helper function to check if a user has access to view a recurring task
 * @param user - Current user
 * @param recurringTask - Recurring task to check access for
 * @returns Boolean indicating if user has access
 */
async function hasRecurringTaskAccess(user: any, recurringTask: any): Promise<boolean> {
  // Admin has access to all recurring tasks
  if (user.role === 'admin') {
    return true;
  }

  // User has access to their own recurring tasks
  if (recurringTask.createdBy && user._id && 
      recurringTask.createdBy.toString() === user._id.toString()) {
    return true;
  }

  // Team leaders have access to team's recurring tasks
  if (user.role === 'team_leader' && 
      recurringTask.teamId && 
      user.teamId && 
      recurringTask.teamId.toString() === user.teamId.toString()) {
    return true;
  }

  return false;
}

/**
 * Helper function to check if a user has access to update/delete a recurring task
 * @param user - Current user
 * @param recurringTask - Recurring task to check update access for
 * @returns Boolean indicating if user has update access
 */
async function hasRecurringTaskUpdateAccess(user: any, recurringTask: any): Promise<boolean> {
  // Admin has update access to all recurring tasks
  if (user.role === 'admin') {
    return true;
  }

  // Creator has update access to their own recurring tasks
  if (recurringTask.createdBy && user._id && 
      recurringTask.createdBy.toString() === user._id.toString()) {
    return true;
  }

  // Team leaders have update access to their team's recurring tasks
  if (user.role === 'team_leader' && 
      recurringTask.teamId && 
      user.teamId && 
      recurringTask.teamId.toString() === user.teamId.toString()) {
    return true;
  }

  return false;
}

export default {
  getRecurringTasks,
  getRecurringTaskById,
  createRecurringTask,
  updateRecurringTask,
  deleteRecurringTask,
  pauseRecurringTask,
  resumeRecurringTask,
  generateTasksNow,
  getRecurringTaskStats,
  addSkipDate,
  removeSkipDate,
  generateTasksForRecurringPattern,
}; 