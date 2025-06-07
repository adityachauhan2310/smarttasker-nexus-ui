import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { body, query, param, validationResult } from 'express-validator';
import { Task, Team, User } from '../models';
import { ErrorResponse } from '../middleware/errorMiddleware';
import { ITask } from '../models/Task';

/**
 * @desc    Get all tasks with filtering, sorting, pagination
 * @route   GET /api/tasks
 * @access  Private
 */
export const getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate query parameters
    await Promise.all([
      query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer').run(req),
      query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100').run(req),
      query('status').optional().isIn(['pending', 'in_progress', 'completed']).withMessage('Invalid status').run(req),
      query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority').run(req),
      query('sortBy').optional().isIn(['dueDate', 'createdAt', 'priority', 'status']).withMessage('Invalid sort field').run(req),
      query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc').run(req),
    ]);

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
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Filtering
    const filter: any = {};

    // Permission-based filtering
    const { user } = req;
    if (!user) {
      next(new ErrorResponse('Not authorized', 401));
      return;
    }

    // Different permissions based on user role
    if (user.role === 'team_member') {
      // Team members can only see tasks assigned to them or created by them
      filter.$or = [
        { assignedTo: user._id },
        { createdBy: user._id }
      ];
    } else if (user.role === 'team_leader') {
      // Team leaders can see their own tasks and tasks of their team members
      const teams = await Team.find({ leader: user._id }).select('members');
      const teamMemberIds = teams.flatMap(team => team.members);
      
      filter.$or = [
        { assignedTo: user._id },
        { createdBy: user._id },
        { assignedTo: { $in: teamMemberIds } },
        { createdBy: { $in: teamMemberIds } }
      ];
    }
    // Admins can see all tasks, so no need to filter

    // Status filtering
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Priority filtering
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Due date filtering
    if (req.query.dueBefore) {
      filter.dueDate = { $lte: new Date(req.query.dueBefore as string) };
    }

    if (req.query.dueAfter) {
      filter.dueDate = { ...filter.dueDate, $gte: new Date(req.query.dueAfter as string) };
    }

    // Assignee filtering
    if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }

    // Search by title or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Sorting
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
    const sort: { [key: string]: number } = {};
    sort[sortBy] = sortOrder;

    // Count total tasks with filter
    const total = await Task.countDocuments(filter);

    // Get tasks
    const tasks = await Task.find(filter)
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task by ID
 * @route   GET /api/tasks/:id
 * @access  Private
 */
export const getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Get task
    const task = await Task.findById(taskId)
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate({
        path: 'comments.user',
        select: 'name email avatar'
      });

    if (!task) {
      next(new ErrorResponse('Task not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTaskPermission(req.user!, task)) {
      next(new ErrorResponse('Not authorized to access this task', 403));
      return;
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new task
 * @route   POST /api/tasks
 * @access  Private
 */
export const createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request
    await Promise.all([
      body('title').trim().notEmpty().withMessage('Title is required').run(req),
      body('description').optional().trim().run(req),
      body('status')
        .optional()
        .isIn(['pending', 'in_progress', 'completed'])
        .withMessage('Invalid status')
        .run(req),
      body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority')
        .run(req),
      body('dueDate').optional().isISO8601().toDate().withMessage('Invalid date format').run(req),
      body('tags').optional().isArray().withMessage('Tags must be an array').run(req),
      body('assignedTo').optional().isMongoId().withMessage('Invalid user ID').run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Check if assignedTo is valid user
    if (req.body.assignedTo) {
      const user = await User.findById(req.body.assignedTo);
      if (!user) {
        next(new ErrorResponse('Assigned user not found', 404));
        return;
      }

      // Check if current user has permission to assign task to this user
      // Team leaders can only assign to their team members, admins can assign to anyone
      if (req.user?.role === 'team_leader') {
        const teams = await Team.find({ leader: req.user._id });
        const teamMemberIds = teams.flatMap(team => team.members.map(member => member.toString()));
        
        if (!teamMemberIds.includes(req.body.assignedTo)) {
          next(new ErrorResponse('You can only assign tasks to your team members', 403));
          return;
        }
      }
    }

    // Create task
    const task = await Task.create({
      ...req.body,
      createdBy: req.user!._id,
    });

    // Populate references
    await task.populate('createdBy', 'name email avatar');
    if (task.assignedTo) {
      await task.populate('assignedTo', 'name email avatar');
    }

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private
 */
export const updateTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Validate request
    await Promise.all([
      body('title').optional().trim().notEmpty().withMessage('Title is required').run(req),
      body('description').optional().trim().run(req),
      body('status')
        .optional()
        .isIn(['pending', 'in_progress', 'completed'])
        .withMessage('Invalid status')
        .run(req),
      body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority')
        .run(req),
      body('dueDate').optional().isISO8601().toDate().withMessage('Invalid date format').run(req),
      body('tags').optional().isArray().withMessage('Tags must be an array').run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Check if task exists
    const task = await Task.findById(taskId);

    if (!task) {
      next(new ErrorResponse('Task not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTaskPermission(req.user!, task, true)) {
      next(new ErrorResponse('Not authorized to update this task', 403));
      return;
    }

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar');

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private
 */
export const deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Check if task exists
    const task = await Task.findById(taskId);

    if (!task) {
      next(new ErrorResponse('Task not found', 404));
      return;
    }

    // Check permissions - only creators, team leaders of creators, and admins can delete
    const user = req.user!;
    if (user.role !== 'admin') {
      if (task.createdBy.toString() !== user._id.toString()) {
        // If not the creator, check if team leader of creator
        if (user.role === 'team_leader') {
          const teams = await Team.find({ leader: user._id });
          const teamMemberIds = teams.flatMap(team => team.members.map(member => member.toString()));
          
          if (!teamMemberIds.includes(task.createdBy.toString())) {
            next(new ErrorResponse('Not authorized to delete this task', 403));
            return;
          }
        } else {
          next(new ErrorResponse('Not authorized to delete this task', 403));
          return;
        }
      }
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Assign task to user
 * @route   POST /api/tasks/:id/assign
 * @access  Private
 */
export const assignTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Validate request
    await body('userId').notEmpty().isMongoId().withMessage('Valid user ID is required').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { userId } = req.body;

    // Check if task exists
    const task = await Task.findById(taskId);

    if (!task) {
      next(new ErrorResponse('Task not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTaskPermission(req.user!, task, true)) {
      next(new ErrorResponse('Not authorized to assign this task', 403));
      return;
    }

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }

    // Team leader can only assign to team members
    if (req.user!.role === 'team_leader') {
      const teams = await Team.find({ leader: req.user!._id });
      const teamMemberIds = teams.flatMap(team => team.members.map(member => member.toString()));
      
      if (!teamMemberIds.includes(userId)) {
        next(new ErrorResponse('You can only assign tasks to your team members', 403));
        return;
      }
    }

    // Update task with new assignment
    const updatedTask = await task.reassign(userId);
    await updatedTask.populate('assignedTo', 'name email avatar');

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove assignment from task
 * @route   DELETE /api/tasks/:id/assign
 * @access  Private
 */
export const removeAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Check if task exists
    const task = await Task.findById(taskId);

    if (!task) {
      next(new ErrorResponse('Task not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTaskPermission(req.user!, task, true)) {
      next(new ErrorResponse('Not authorized to unassign this task', 403));
      return;
    }

    // Remove assignment
    const updatedTask = await task.reassign(null);

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task status
 * @route   PUT /api/tasks/:id/status
 * @access  Private
 */
export const updateTaskStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Validate request
    await body('status')
      .notEmpty()
      .isIn(['pending', 'in_progress', 'completed'])
      .withMessage('Invalid status')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Check if task exists
    const task = await Task.findById(taskId);

    if (!task) {
      next(new ErrorResponse('Task not found', 404));
      return;
    }

    // Check permissions - Allow assigned user, creator, team leader, and admin to update status
    const canUpdate = await hasTaskPermission(req.user!, task, false);
    if (!canUpdate) {
      next(new ErrorResponse('Not authorized to update this task status', 403));
      return;
    }

    // Update task status
    task.status = req.body.status;
    await task.save();

    // If marked as completed, let's store the completion date (could add this field to the model)
    if (req.body.status === 'completed' && task.status !== 'completed') {
      task.set('completedAt', new Date(), { strict: false });
      await task.save();
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task priority
 * @route   PUT /api/tasks/:id/priority
 * @access  Private
 */
export const updateTaskPriority = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Validate request
    await body('priority')
      .notEmpty()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority')
      .run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Check if task exists
    const task = await Task.findById(taskId);

    if (!task) {
      next(new ErrorResponse('Task not found', 404));
      return;
    }

    // Check permissions - Creators, team leaders, and admins can change priority
    if (!await hasTaskPermission(req.user!, task, true)) {
      next(new ErrorResponse('Not authorized to update this task priority', 403));
      return;
    }

    // Update task priority
    task.priority = req.body.priority;
    await task.save();

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add comment to task
 * @route   POST /api/tasks/:id/comments
 * @access  Private
 */
export const addComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const taskId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      next(new ErrorResponse('Invalid task ID', 400));
      return;
    }

    // Validate request
    await body('text').trim().notEmpty().withMessage('Comment text is required').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Check if task exists
    const task = await Task.findById(taskId);

    if (!task) {
      next(new ErrorResponse('Task not found', 404));
      return;
    }

    // Check permissions - Any user who can view the task can comment
    if (!await hasTaskPermission(req.user!, task, false)) {
      next(new ErrorResponse('Not authorized to comment on this task', 403));
      return;
    }

    // Add comment
    const updatedTask = await task.addComment(req.user!._id, req.body.text);

    // Populate comment user info
    await updatedTask.populate({
      path: 'comments.user',
      select: 'name email avatar',
    });

    res.status(201).json({
      success: true,
      data: updatedTask.comments[updatedTask.comments.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update task comment
 * @route   PUT /api/tasks/:id/comments/:commentId
 * @access  Private
 */
export const updateComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: taskId, commentId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      next(new ErrorResponse('Invalid ID', 400));
      return;
    }

    // Validate request
    await body('text').trim().notEmpty().withMessage('Comment text is required').run(req);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Check if task exists
    const task = await Task.findById(taskId);

    if (!task) {
      next(new ErrorResponse('Task not found', 404));
      return;
    }

    // Find the comment
    const comment = task.comments.id(commentId);

    if (!comment) {
      next(new ErrorResponse('Comment not found', 404));
      return;
    }

    // Check if user is the comment author or admin
    if (comment.user.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      next(new ErrorResponse('Not authorized to update this comment', 403));
      return;
    }

    // Update comment
    comment.text = req.body.text;
    await task.save();

    // Populate user info
    await task.populate({
      path: 'comments.user',
      select: 'name email avatar',
    });

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete task comment
 * @route   DELETE /api/tasks/:id/comments/:commentId
 * @access  Private
 */
export const deleteComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: taskId, commentId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(taskId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      next(new ErrorResponse('Invalid ID', 400));
      return;
    }

    // Check if task exists
    const task = await Task.findById(taskId);

    if (!task) {
      next(new ErrorResponse('Task not found', 404));
      return;
    }

    // Find the comment
    const comment = task.comments.id(commentId);

    if (!comment) {
      next(new ErrorResponse('Comment not found', 404));
      return;
    }

    // Check if user is the comment author, task creator, or admin
    const isAdmin = req.user!.role === 'admin';
    const isCommentAuthor = comment.user.toString() === req.user!._id.toString();
    const isTaskCreator = task.createdBy.toString() === req.user!._id.toString();
    const isTeamLeader = req.user!.role === 'team_leader' && await isUserTeamLeaderOf(req.user!._id, comment.user);

    if (!isAdmin && !isCommentAuthor && !isTaskCreator && !isTeamLeader) {
      next(new ErrorResponse('Not authorized to delete this comment', 403));
      return;
    }

    // Remove comment
    task.comments.pull({ _id: commentId });
    await task.save();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task metrics/statistics for dashboard
 * @route   GET /api/tasks/metrics
 * @access  Private
 */
export const getTaskMetrics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { user } = req;
    if (!user) {
      next(new ErrorResponse('Not authorized', 401));
      return;
    }

    // Base filter - Different for each role
    let taskFilter: any = {};
    let userFilter: any = {};

    if (user.role === 'team_member') {
      // Team members - only their own tasks
      taskFilter.$or = [
        { assignedTo: user._id },
        { createdBy: user._id }
      ];
      userFilter = { _id: user._id };
    } else if (user.role === 'team_leader') {
      // Team leaders - their teams' tasks
      const teams = await Team.find({ leader: user._id });
      const teamMemberIds = teams.flatMap(team => team.members);
      teamMemberIds.push(user._id); // Include team leader's own tasks
      
      taskFilter.$or = [
        { assignedTo: { $in: teamMemberIds } },
        { createdBy: { $in: teamMemberIds } }
      ];
      userFilter = { _id: { $in: teamMemberIds } };
    }
    // Admins can see everything, no filter needed

    // Time period filter
    const currentDate = new Date();
    const pastDate = new Date();
    pastDate.setDate(currentDate.getDate() - 30); // Last 30 days

    // Task metrics
    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasksCount,
      tasksCreatedThisMonth,
      tasksCompletedThisMonth,
      highPriorityTasks
    ] = await Promise.all([
      Task.countDocuments(taskFilter),
      Task.countDocuments({ ...taskFilter, status: 'pending' }),
      Task.countDocuments({ ...taskFilter, status: 'in_progress' }),
      Task.countDocuments({ ...taskFilter, status: 'completed' }),
      Task.countDocuments({ 
        ...taskFilter, 
        status: { $ne: 'completed' },
        dueDate: { $lt: currentDate }
      }),
      Task.countDocuments({
        ...taskFilter,
        createdAt: { $gte: pastDate, $lte: currentDate }
      }),
      Task.countDocuments({
        ...taskFilter,
        status: 'completed',
        updatedAt: { $gte: pastDate, $lte: currentDate }
      }),
      Task.countDocuments({
        ...taskFilter,
        priority: { $in: ['high', 'urgent'] },
        status: { $ne: 'completed' }
      })
    ]);

    // Metrics by priority
    const priorityMetrics = await Task.aggregate([
      { $match: { ...taskFilter, status: { $ne: 'completed' } } },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    // Metrics by user (top performers)
    let userMetrics: any[] = [];
    if (user.role !== 'team_member') {
      userMetrics = await Task.aggregate([
        { $match: { ...taskFilter, status: 'completed' } },
        { $group: { _id: '$assignedTo', tasksCompleted: { $sum: 1 } } },
        { $sort: { tasksCompleted: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, userId: '$_id', userName: '$user.name', tasksCompleted: 1 } }
      ]);
    }

    res.status(200).json({
      success: true,
      data: {
        overview: {
          total: totalTasks,
          pending: pendingTasks,
          inProgress: inProgressTasks,
          completed: completedTasks,
          overdue: overdueTasksCount,
          highPriority: highPriorityTasks
        },
        monthlyActivity: {
          created: tasksCreatedThisMonth,
          completed: tasksCompletedThisMonth,
          completionRate: tasksCreatedThisMonth > 0 
            ? Math.round((tasksCompletedThisMonth / tasksCreatedThisMonth) * 100) 
            : 0
        },
        priorityDistribution: priorityMetrics.reduce((acc: any, curr: any) => {
          acc[curr._id] = curr.count;
          return acc;
        }, { low: 0, medium: 0, high: 0, urgent: 0 }),
        topPerformers: userMetrics
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to check if a user has permission to view or edit a task
 * @param user - The user to check permissions for
 * @param task - The task to check permissions on
 * @param requiresEditPermission - Whether edit permission is required (stricter than view)
 */
async function hasTaskPermission(user: any, task: ITask, requiresEditPermission = false): Promise<boolean> {
  // Admins can view and edit all tasks
  if (user.role === 'admin') {
    return true;
  }

  // Users can always view and edit their own tasks
  if (task.createdBy.toString() === user._id.toString()) {
    return true;
  }

  // Users can view and update tasks assigned to them
  if (task.assignedTo?.toString() === user._id.toString()) {
    // For edit permissions, let's say assignees can only update status, not edit all fields
    if (requiresEditPermission) {
      return false; // Assignees can't edit all fields
    }
    return true; // Assignees can view and update status
  }

  // Team leaders can view and edit tasks of their team members
  if (user.role === 'team_leader') {
    // Check if creator or assignee is in team leader's teams
    const isCreatorInTeam = await isUserTeamLeaderOf(user._id, task.createdBy);
    const isAssigneeInTeam = task.assignedTo && await isUserTeamLeaderOf(user._id, task.assignedTo);
    
    return isCreatorInTeam || isAssigneeInTeam;
  }

  return false;
}

/**
 * Helper function to check if a user is the team leader of another user
 */
async function isUserTeamLeaderOf(leaderId: mongoose.Types.ObjectId, memberId: mongoose.Types.ObjectId): Promise<boolean> {
  const team = await Team.findOne({
    leader: leaderId,
    members: { $elemMatch: { $eq: memberId } }
  });
  
  return !!team;
}

export default {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  removeAssignment,
  updateTaskStatus,
  updateTaskPriority,
  addComment,
  updateComment,
  deleteComment,
  getTaskMetrics
}; 