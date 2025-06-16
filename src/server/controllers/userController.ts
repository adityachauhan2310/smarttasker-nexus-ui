
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { User } from '../models';
import { ErrorResponse } from '../middleware/errorMiddleware';
import bcrypt from 'bcrypt';
import config from '../config/config';

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Admin
 */
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    // Apply filters
    const filter: any = {};
    
    if (req.query.role) {
      filter.role = req.query.role;
    }
    
    if (req.query.search) {
      const search = req.query.search as string;
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    
    // Count total users
    const total = await User.countDocuments(filter);
    
    // Get users with proper field selection
    const users = await User.find(filter)
      .select('-password -refreshToken -resetPasswordToken -verificationToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: users,
    });
  } catch (error) {
    console.error('Error getting users:', error);
    next(error);
  }
};

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Admin
 */
export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      next(new ErrorResponse('Invalid user ID', 400));
      return;
    }
    
    const user = await User.findById(userId)
      .select('-password -refreshToken -resetPasswordToken -verificationToken')
      .lean();
    
    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting user:', error);
    next(error);
  }
};

/**
 * @desc    Create user
 * @route   POST /api/users
 * @access  Admin
 */
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request
    await Promise.all([
      body('name').trim().notEmpty().withMessage('Name is required').run(req),
      body('email').isEmail().withMessage('Please provide a valid email').run(req),
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .run(req),
      body('role')
        .optional()
        .isIn(['admin', 'team_leader', 'team_member'])
        .withMessage('Invalid role')
        .run(req),
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
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
    
    if (existingUser) {
      next(new ErrorResponse('Email already in use', 400));
      return;
    }
    
    // Create user with explicit password hashing
    const userData = {
      name: req.body.name.trim(),
      email: req.body.email.toLowerCase().trim(),
      password: req.body.password,
      role: req.body.role || 'team_member',
      avatar: req.body.avatar,
      isActive: true,
      verified: true, // Auto-verify admin-created users
    };
    
    console.log('Creating user with data:', { ...userData, password: '[REDACTED]' });
    
    const user = await User.create(userData);
    
    // Return user without sensitive data
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActive: user.isActive,
      verified: user.verified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
    
    console.log('User created successfully:', userResponse);
    
    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully',
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 11000) {
      next(new ErrorResponse('Email already exists', 400));
    } else {
      next(error);
    }
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Admin
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      next(new ErrorResponse('Invalid user ID', 400));
      return;
    }
    
    // Validate request
    await Promise.all([
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').run(req),
      body('email').optional().isEmail().withMessage('Please provide a valid email').run(req),
      body('role')
        .optional()
        .isIn(['admin', 'team_leader', 'team_member'])
        .withMessage('Invalid role')
        .run(req),
      body('isActive').optional().isBoolean().withMessage('isActive must be a boolean').run(req),
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
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }
    
    // Check if email is already taken
    if (req.body.email && req.body.email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
      
      if (existingUser) {
        next(new ErrorResponse('Email already in use', 400));
        return;
      }
    }

    // Prevent deactivating yourself
    if (
      req.user &&
      userId === req.user._id.toString() &&
      req.body.isActive === false
    ) {
      next(new ErrorResponse('Cannot deactivate your own account', 400));
      return;
    }
    
    // Update user
    const fieldsToUpdate: any = {};
    
    if (req.body.name) fieldsToUpdate.name = req.body.name.trim();
    if (req.body.email) fieldsToUpdate.email = req.body.email.toLowerCase().trim();
    if (req.body.role) fieldsToUpdate.role = req.body.role;
    if (req.body.avatar) fieldsToUpdate.avatar = req.body.avatar;
    if (typeof req.body.isActive !== 'undefined') {
      fieldsToUpdate.isActive = req.body.isActive;
      // If deactivating, invalidate any refresh tokens
      if (!req.body.isActive) {
        fieldsToUpdate.refreshToken = undefined;
      }
    }
    
    console.log('Updating user with fields:', fieldsToUpdate);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select('-password -refreshToken -resetPasswordToken -verificationToken');
    
    console.log('User updated successfully:', updatedUser);
    
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === 11000) {
      next(new ErrorResponse('Email already exists', 400));
    } else {
      next(error);
    }
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      next(new ErrorResponse('Invalid user ID', 400));
      return;
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }
    
    // Prevent deleting yourself
    if (req.user && userId === req.user._id.toString()) {
      next(new ErrorResponse('Cannot delete your own account', 400));
      return;
    }

    console.log(`Attempting to delete user: ${user.email} (ID: ${userId})`);

    try {
      // Delete the user
      await User.findByIdAndDelete(userId);

      // Log the deletion
      console.log(`User ${user.email} deleted successfully by admin ${req.user?.email}`);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
        data: {},
      });
    } catch (error) {
      console.error('Error during user deletion:', error);
      next(new ErrorResponse('Failed to delete user', 500));
    }
  } catch (error) {
    console.error('Error in deleteUser controller:', error);
    next(error);
  }
};

/**
 * @desc    Reset user password
 * @route   PUT /api/users/:id/reset-password
 * @access  Admin
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.params.id;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      next(new ErrorResponse('Invalid user ID', 400));
      return;
    }
    
    // Validate request
    await Promise.all([
      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .run(req),
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
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }
    
    console.log(`Resetting password for user: ${user.email} (ID: ${userId})`);
    
    // Hash the new password manually to ensure it's properly hashed
    const saltRounds = config.bcryptSaltRounds || 12;
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    
    try {
      // Update password directly in database
      await User.findByIdAndUpdate(userId, {
        password: hashedPassword,
        refreshToken: undefined, // Invalidate any existing refresh tokens
      });
      
      // Log the password change
      console.log(`Password reset successfully for user ${user.email} by admin ${req.user?.email}`);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      console.error('Error saving user password:', error);
      next(new ErrorResponse('Failed to reset password', 500));
    }
  } catch (error) {
    console.error('Error in resetPassword controller:', error);
    next(error);
  }
};

export default {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
};
