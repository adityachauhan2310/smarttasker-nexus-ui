import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Team } from '../models';
import { ErrorResponse } from './errorMiddleware';

/**
 * Middleware to check if user has access to view a team
 * Allows: Team members, Team leader, Admins
 */
export const hasTeamAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;
    
    // Validate teamId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
      return;
    }
    
    // Get team
    const team = await Team.findById(teamId);
    
    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }
    
    const user = req.user!;
    
    // Admin has access to all teams
    if (user.role === 'admin') {
      next();
      return;
    }
    
    // Team leader has access to their team
    if (team.leader.toString() === user._id.toString()) {
      next();
      return;
    }
    
    // Team members have access to their team
    if (team.members.some(member => member.toString() === user._id.toString())) {
      next();
      return;
    }
    
    // No access
    next(new ErrorResponse('Not authorized to access this team', 403));
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user has management rights for a team
 * Allows: Team leader, Admins
 */
export const canManageTeam = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teamId = req.params.id;
    
    // Validate teamId
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      next(new ErrorResponse('Invalid team ID', 400));
      return;
    }
    
    // Get team
    const team = await Team.findById(teamId);
    
    if (!team) {
      next(new ErrorResponse('Team not found', 404));
      return;
    }
    
    const user = req.user!;
    
    // Admin can manage all teams
    if (user.role === 'admin') {
      next();
      return;
    }
    
    // Team leader can manage their team
    if (team.leader.toString() === user._id.toString()) {
      next();
      return;
    }
    
    // No management rights
    next(new ErrorResponse('Not authorized to manage this team', 403));
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can add/remove members from a team
 * Allows: Team leader, Admins
 */
export const canModifyTeamMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Reuse canManageTeam since the permission requirements are the same
    await canManageTeam(req, res, next);
  } catch (error) {
    next(error);
  }
};

export default {
  hasTeamAccess,
  canManageTeam,
  canModifyTeamMembers,
}; 