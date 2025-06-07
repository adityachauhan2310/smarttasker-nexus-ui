import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { body, query, param, validationResult } from 'express-validator';
import { Team, User, Task, ITeam } from '../models';
import { ErrorResponse } from '../middleware/errorMiddleware';

/**
 * @desc    Get all teams (filtered by permission)
 * @route   GET /api/teams
 * @access  Private
 */
export const getTeams = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate query parameters
    await query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer').run(req);
    await query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100').run(req);

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

    // Permission-based filtering
    const filter: any = {};
    if (!req.user) {
      next(new ErrorResponse('Not authorized', 401));
      return;
    }

    // Filter based on user role
    // Admins see all teams, team leaders see only their own teams
    if (req.user.role !== 'admin') {
      filter.leader = req.user._id;
    }

    // Name search filter
    if (req.query.search) {
      filter.name = new RegExp(req.query.search as string, 'i');
    }

    // Count total teams with filter
    const total = await Team.countDocuments(filter);

    // Get teams
    const teams = await Team.find(filter)
      .populate('leader', 'name email avatar')
      .populate('members', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Add member count to each team
    const teamsWithCount = teams.map(team => ({
      ...team.toObject(),
      memberCount: team.members.length
    }));

    res.status(200).json({
      success: true,
      count: teams.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: teamsWithCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get team by ID
 * @route   GET /api/teams/:id
 * @access  Private
 */
export const getTeamById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
      return;
    }

    // Get team
    const team = await Team.findById(teamId)
      .populate('leader', 'name email avatar')
      .populate('members', 'name email avatar');

    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTeamAccess(req.user!, team)) {
      next(new ErrorResponse('Not authorized to access this team', 403));
      return;
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new team
 * @route   POST /api/teams
 * @access  Admin only
 */
export const createTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request
    await Promise.all([
      body('name').trim().notEmpty().withMessage('Team name is required').run(req),
      body('description').optional().trim().run(req),
      body('leader').isMongoId().withMessage('Valid leader ID is required').run(req),
      body('members').optional().isArray().withMessage('Members must be an array').run(req),
      body('members.*').optional().isMongoId().withMessage('Valid member IDs are required').run(req),
      body('coLeaders').optional().isArray().withMessage('Co-leaders must be an array').run(req),
      body('coLeaders.*').optional().isMongoId().withMessage('Valid co-leader IDs are required').run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation failed',
      });
      return;
    }

    // Check if user is admin
    if (req.user?.role !== 'admin') {
      next(new ErrorResponse('Only admins can create teams', 403));
      return;
    }

    // Check if leader exists and is valid
    const leader = await User.findById(req.body.leader);
    if (!leader) {
      next(new ErrorResponse('Leader not found', 404));
      return;
    }

    // If leader is not team_leader, update their role
    if (leader.role !== 'team_leader' && leader.role !== 'admin') {
      leader.role = 'team_leader';
      await leader.save();
      console.log(`Updated user ${leader.name} to team leader role`);
    }

    // Process co-leaders if provided
    let coLeaders: mongoose.Types.ObjectId[] = [];
    if (req.body.coLeaders && req.body.coLeaders.length > 0) {
      const coLeaderIds = req.body.coLeaders.map((id: string) => new mongoose.Types.ObjectId(id));
      
      // Check for duplicate co-leaders
      const uniqueCoLeaders = [...new Set(coLeaderIds.map(id => id.toString()))];
      if (uniqueCoLeaders.length !== coLeaderIds.length) {
        next(new ErrorResponse('Duplicate co-leader IDs provided', 400));
        return;
      }

      // Don't include the primary leader in co-leaders
      coLeaders = coLeaderIds.filter(id => id.toString() !== req.body.leader.toString());

      // Check if each co-leader exists
      const foundCoLeaders = await User.find({ _id: { $in: coLeaders } });
      if (foundCoLeaders.length !== coLeaders.length) {
        next(new ErrorResponse('One or more co-leaders not found', 404));
        return;
      }

      // Update co-leaders' roles if needed
      for (const coLeader of foundCoLeaders) {
        if (coLeader.role !== 'team_leader' && coLeader.role !== 'admin') {
          coLeader.role = 'team_leader';
          await coLeader.save();
          console.log(`Updated user ${coLeader.name} to team leader role`);
        }
      }
    }

    // Validate members if provided
    let validMembers: mongoose.Types.ObjectId[] = [];
    if (req.body.members && req.body.members.length > 0) {
      const memberIds = req.body.members.map((id: string) => new mongoose.Types.ObjectId(id));
      
      // Check for duplicate members
      const uniqueMembers = [...new Set(memberIds.map(id => id.toString()))];
      if (uniqueMembers.length !== memberIds.length) {
        next(new ErrorResponse('Duplicate member IDs provided', 400));
        return;
      }

      // Check if each member exists
      const members = await User.find({ _id: { $in: memberIds } });
      if (members.length !== memberIds.length) {
        next(new ErrorResponse('One or more members not found', 404));
        return;
      }

      validMembers = memberIds;
    }

    // Make sure leader is not in members array to prevent duplication
    validMembers = validMembers.filter(id => id.toString() !== leader._id.toString());
    
    // Make sure co-leaders are not in members array to prevent duplication
    if (coLeaders.length > 0) {
      validMembers = validMembers.filter(id => 
        !coLeaders.some(coLeaderId => coLeaderId.toString() === id.toString())
      );
    }

    // Create team
    const team = await Team.create({
      name: req.body.name,
      description: req.body.description || '',
      leader: req.body.leader,
      members: validMembers,
      coLeaders: coLeaders
    });

    // Populate references
    await team.populate('leader', 'name email avatar');
    await team.populate('members', 'name email avatar');
    await team.populate('coLeaders', 'name email avatar');

    // Log event
    logTeamEvent(req.user!, 'team_created', team._id);

    res.status(201).json({
      success: true,
      data: {
        team
      }
    });
  } catch (error) {
    console.error('Team creation error:', error);
    next(error);
  }
};

/**
 * @desc    Update team
 * @route   PUT /api/teams/:id
 * @access  Admin, Team Leader
 */
export const updateTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
      return;
    }

    // Validate request
    await Promise.all([
      body('name').optional().trim().notEmpty().withMessage('Team name is required if provided').run(req),
      body('description').optional().trim().run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Check if team exists
    const team = await Team.findById(teamId);

    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTeamManagementAccess(req.user!, team)) {
      next(new ErrorResponse('Not authorized to update this team', 403));
      return;
    }

    // Update fields that are allowed to be updated
    const fieldsToUpdate: Partial<ITeam> = {};
    
    if (req.body.name !== undefined) {
      fieldsToUpdate.name = req.body.name;
    }
    
    if (req.body.description !== undefined) {
      fieldsToUpdate.description = req.body.description;
    }

    // Update team
    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      fieldsToUpdate,
      { new: true, runValidators: true }
    )
      .populate('leader', 'name email avatar')
      .populate('members', 'name email avatar');

    // Log event
    logTeamEvent(req.user!, 'team_updated', team._id);

    res.status(200).json({
      success: true,
      data: updatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete team
 * @route   DELETE /api/teams/:id
 * @access  Admin only
 */
export const deleteTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
      return;
    }

    // Check if user is admin
    if (req.user?.role !== 'admin') {
      next(new ErrorResponse('Only admins can delete teams', 403));
      return;
    }

    // Check if team exists
    const team = await Team.findById(teamId);

    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }

    // Delete team
    await team.deleteOne();

    // Log event
    logTeamEvent(req.user!, 'team_deleted', teamId);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add member to team
 * @route   POST /api/teams/:id/members
 * @access  Admin, Team Leader
 */
export const addTeamMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
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

    // Check if team exists
    const team = await Team.findById(teamId);

    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTeamManagementAccess(req.user!, team)) {
      next(new ErrorResponse('Not authorized to manage this team', 403));
      return;
    }

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }

    // Check if user is already in the team
    if (team.members.some(member => member.toString() === userId)) {
      next(new ErrorResponse('User is already a member of this team', 400));
      return;
    }

    // Check if user is the leader
    if (team.leader.toString() === userId) {
      next(new ErrorResponse('Team leader cannot be added as a member', 400));
      return;
    }

    // Add member to team
    const updatedTeam = await team.addMember(new mongoose.Types.ObjectId(userId));
    await updatedTeam.populate('members', 'name email avatar');

    // Log event
    logTeamEvent(req.user!, 'member_added', team._id, userId);

    res.status(200).json({
      success: true,
      data: updatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from team
 * @route   DELETE /api/teams/:id/members/:userId
 * @access  Admin, Team Leader
 */
export const removeTeamMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: teamId, userId } = req.params;

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(userId)) {
      next(new ErrorResponse('Invalid ID', 400));
      return;
    }

    // Check if team exists
    const team = await Team.findById(teamId);

    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTeamManagementAccess(req.user!, team)) {
      next(new ErrorResponse('Not authorized to manage this team', 403));
      return;
    }

    // Check if user is in the team
    if (!team.members.some(member => member.toString() === userId)) {
      next(new ErrorResponse('User is not a member of this team', 400));
      return;
    }

    // Remove member from team
    const updatedTeam = await team.removeMember(new mongoose.Types.ObjectId(userId));

    // Log event
    logTeamEvent(req.user!, 'member_removed', team._id, userId);

    res.status(200).json({
      success: true,
      data: updatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change team leader
 * @route   PUT /api/teams/:id/leader
 * @access  Admin only
 */
export const changeTeamLeader = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
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

    // Check if user is admin
    if (req.user?.role !== 'admin') {
      next(new ErrorResponse('Only admins can change team leaders', 403));
      return;
    }

    const { userId } = req.body;

    // Check if team exists
    const team = await Team.findById(teamId);

    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }

    // Check if new leader exists
    const newLeader = await User.findById(userId);

    if (!newLeader) {
      next(new ErrorResponse('User not found', 404));
      return;
    }

    // Store old leader id for later
    const oldLeaderId = team.leader;

    // If new leader is currently a member, remove from members
    if (team.members.some(member => member.toString() === userId)) {
      await team.removeMember(new mongoose.Types.ObjectId(userId));
    }

    // Update leader role if not admin
    if (newLeader.role !== 'team_leader' && newLeader.role !== 'admin') {
      newLeader.role = 'team_leader';
      await newLeader.save();
    }

    // Update team with new leader
    team.leader = new mongoose.Types.ObjectId(userId);
    await team.save();

    // Add old leader as a member if they are not already on another team
    const oldLeaderIsLeaderElsewhere = await Team.findOne({ 
      _id: { $ne: teamId },
      leader: oldLeaderId 
    });

    if (!oldLeaderIsLeaderElsewhere) {
      const oldLeader = await User.findById(oldLeaderId);
      if (oldLeader && oldLeader.role === 'team_leader' && oldLeader.role !== 'admin') {
        oldLeader.role = 'team_member';
        await oldLeader.save();
      }
      
      // Add old leader as member if not already
      if (!team.members.some(member => member.toString() === oldLeaderId.toString())) {
        await team.addMember(oldLeaderId);
      }
    }

    // Get updated team with populated fields
    const updatedTeam = await Team.findById(teamId)
      .populate('leader', 'name email avatar')
      .populate('members', 'name email avatar');

    // Log event
    logTeamEvent(req.user!, 'leader_changed', team._id, userId, oldLeaderId.toString());

    res.status(200).json({
      success: true,
      data: updatedTeam,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get team members
 * @route   GET /api/teams/:id/members
 * @access  Private (Team members, Team Leader, Admin)
 */
export const getTeamMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
      return;
    }

    // Check if team exists
    const team = await Team.findById(teamId);

    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTeamAccess(req.user!, team)) {
      next(new ErrorResponse('Not authorized to access this team', 403));
      return;
    }

    // Get team members with detailed info
    const members = await User.find({ _id: { $in: team.members } })
      .select('name email avatar role createdAt');

    res.status(200).json({
      success: true,
      count: members.length,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get tasks associated with team
 * @route   GET /api/teams/:id/tasks
 * @access  Private (Team members, Team Leader, Admin)
 */
export const getTeamTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;

    // Validate query parameters
    await Promise.all([
      query('page').optional().isInt({ min: 1 }).toInt().withMessage('Page must be a positive integer').run(req),
      query('limit').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('Limit must be between 1 and 100').run(req),
      query('status').optional().isIn(['pending', 'in_progress', 'completed']).withMessage('Invalid status').run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
      return;
    }

    // Check if team exists
    const team = await Team.findById(teamId);

    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTeamAccess(req.user!, team)) {
      next(new ErrorResponse('Not authorized to access this team', 403));
      return;
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get all team members including leader
    const teamMemberIds = [...team.members.map(id => id.toString()), team.leader.toString()];

    // Create filter for tasks
    let filter: any = {
      $or: [
        { assignedTo: { $in: teamMemberIds } },
        { createdBy: { $in: teamMemberIds } }
      ]
    };

    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Count total tasks with filter
    const total = await Task.countDocuments(filter);

    // Get tasks
    const tasks = await Task.find(filter)
      .populate('createdBy', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .sort({ createdAt: -1 })
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
 * @desc    Create task for team
 * @route   POST /api/teams/:id/tasks
 * @access  Private (Team Leader, Admin)
 */
export const createTeamTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
      return;
    }

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

    // Check if team exists
    const team = await Team.findById(teamId);

    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTeamManagementAccess(req.user!, team)) {
      next(new ErrorResponse('Not authorized to create tasks for this team', 403));
      return;
    }

    // Validate assignedTo is a team member if provided
    if (req.body.assignedTo) {
      const isTeamMember = team.members.some(member => member.toString() === req.body.assignedTo) || 
                           team.leader.toString() === req.body.assignedTo;

      if (!isTeamMember) {
        next(new ErrorResponse('Assigned user must be a member of this team', 400));
        return;
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
 * @desc    Get team performance metrics
 * @route   GET /api/teams/:id/analytics
 * @access  Private (Team Leader, Admin)
 */
export const getTeamAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
      return;
    }

    // Check if team exists
    const team = await Team.findById(teamId);

    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }

    // Check permissions
    if (!await hasTeamManagementAccess(req.user!, team)) {
      next(new ErrorResponse('Not authorized to access team analytics', 403));
      return;
    }

    // Get all team members including leader
    const teamMemberIds = [...team.members.map(id => id), team.leader];

    // Time period filter
    const currentDate = new Date();
    const pastDate = new Date();
    pastDate.setDate(currentDate.getDate() - 30); // Last 30 days

    // Basic task metrics
    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasksCount,
      tasksCreatedThisMonth,
      tasksCompletedThisMonth,
    ] = await Promise.all([
      Task.countDocuments({ 
        $or: [
          { assignedTo: { $in: teamMemberIds } },
          { createdBy: { $in: teamMemberIds } }
        ] 
      }),
      Task.countDocuments({ 
        status: 'pending',
        $or: [
          { assignedTo: { $in: teamMemberIds } },
          { createdBy: { $in: teamMemberIds } }
        ] 
      }),
      Task.countDocuments({ 
        status: 'in_progress',
        $or: [
          { assignedTo: { $in: teamMemberIds } },
          { createdBy: { $in: teamMemberIds } }
        ]
      }),
      Task.countDocuments({ 
        status: 'completed',
        $or: [
          { assignedTo: { $in: teamMemberIds } },
          { createdBy: { $in: teamMemberIds } }
        ]
      }),
      Task.countDocuments({ 
        status: { $ne: 'completed' },
        dueDate: { $lt: currentDate },
        $or: [
          { assignedTo: { $in: teamMemberIds } },
          { createdBy: { $in: teamMemberIds } }
        ]
      }),
      Task.countDocuments({
        createdAt: { $gte: pastDate, $lte: currentDate },
        $or: [
          { assignedTo: { $in: teamMemberIds } },
          { createdBy: { $in: teamMemberIds } }
        ]
      }),
      Task.countDocuments({
        status: 'completed',
        updatedAt: { $gte: pastDate, $lte: currentDate },
        $or: [
          { assignedTo: { $in: teamMemberIds } },
          { createdBy: { $in: teamMemberIds } }
        ]
      }),
    ]);

    // Member performance comparison
    const memberPerformance = await Task.aggregate([
      { 
        $match: { 
          assignedTo: { $in: teamMemberIds },
          status: 'completed',
          updatedAt: { $gte: pastDate }
        } 
      },
      { 
        $group: { 
          _id: '$assignedTo', 
          tasksCompleted: { $sum: 1 },
          averageCompletionTime: { 
            $avg: { 
              $subtract: ['$updatedAt', '$createdAt'] 
            } 
          },
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          name: '$userInfo.name',
          email: '$userInfo.email',
          tasksCompleted: 1,
          averageCompletionTimeHours: { $divide: ['$averageCompletionTime', 1000 * 60 * 60] } // Convert ms to hours
        }
      },
      { $sort: { tasksCompleted: -1 } }
    ]);

    // Calculate team productivity metrics
    const completionRate = tasksCreatedThisMonth > 0 
      ? (tasksCompletedThisMonth / tasksCreatedThisMonth) * 100
      : 0;
    
    const overdueRate = totalTasks > 0 
      ? (overdueTasksCount / totalTasks) * 100
      : 0;

    // Get priority distribution
    const priorityDistribution = await Task.aggregate([
      { 
        $match: { 
          $or: [
            { assignedTo: { $in: teamMemberIds } },
            { createdBy: { $in: teamMemberIds } }
          ]
        } 
      },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Format priority distribution
    const formattedPriorityDistribution = priorityDistribution.reduce((acc: any, curr: any) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { low: 0, medium: 0, high: 0, urgent: 0 });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalTasks,
          pendingTasks,
          inProgressTasks,
          completedTasks,
          overdueTasksCount,
        },
        productivity: {
          completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
          overdueRate: Math.round(overdueRate * 100) / 100, // Round to 2 decimal places
          tasksCreatedThisMonth,
          tasksCompletedThisMonth,
        },
        priorityDistribution: formattedPriorityDistribution,
        memberPerformance,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to check if a user has access to view team information
 * @param user - Current user
 * @param team - Team to check access for
 */
async function hasTeamAccess(user: any, team: ITeam): Promise<boolean> {
  // Admins have access to all teams
  if (user.role === 'admin') {
    return true;
  }

  // Team leaders have access to their own teams
  if (team.leader.toString() === user._id.toString()) {
    return true;
  }

  // Team members have access to teams they belong to
  if (team.members.some(member => member.toString() === user._id.toString())) {
    return true;
  }

  return false;
}

/**
 * Helper function to check if a user has access to manage a team
 * @param user - Current user
 * @param team - Team to check management access for
 */
async function hasTeamManagementAccess(user: any, team: ITeam): Promise<boolean> {
  // Admins have management access to all teams
  if (user.role === 'admin') {
    return true;
  }

  // Team leaders have management access to their own teams
  if (team.leader.toString() === user._id.toString()) {
    return true;
  }

  return false;
}

/**
 * Log team-related events
 * @param user - User performing the action
 * @param action - Action performed
 * @param teamId - Team ID
 * @param targetUserId - Target user ID (optional)
 * @param additionalInfo - Additional information (optional)
 */
function logTeamEvent(
  user: any, 
  action: string, 
  teamId: mongoose.Types.ObjectId | string, 
  targetUserId?: string, 
  additionalInfo?: string
): void {
  const eventLog = {
    timestamp: new Date(),
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
    },
    action,
    teamId: teamId.toString(),
    targetUserId,
    additionalInfo,
  };

  console.log(`TEAM EVENT: ${JSON.stringify(eventLog)}`);
  
  // In a production environment, you would store this in a database or send to a logging service
  // Example: await EventLog.create(eventLog);
}

export default {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  changeTeamLeader,
  getTeamMembers,
  getTeamTasks,
  createTeamTask,
  getTeamAnalytics,
}; 