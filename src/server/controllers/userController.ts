import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { User } from '../models';
import { ErrorResponse } from '../middleware/errorMiddleware';

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
    
    // Get users
    const users = await User.find(filter)
      .select('-refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
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
    
    const user = await User.findById(userId).select('-refreshToken');
    
    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
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
      });
      return;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: req.body.email });
    
    if (existingUser) {
      next(new ErrorResponse('Email already in use', 400));
      return;
    }
    
    // Create user
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role || 'team_member',
      avatar: req.body.avatar,
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
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
    if (req.body.email && req.body.email !== user.email) {
      const existingUser = await User.findOne({ email: req.body.email });
      
      if (existingUser) {
        next(new ErrorResponse('Email already in use', 400));
        return;
      }
    }
    
    // Update user
    const fieldsToUpdate: any = {};
    
    if (req.body.name) fieldsToUpdate.name = req.body.name;
    if (req.body.email) fieldsToUpdate.email = req.body.email;
    if (req.body.role) fieldsToUpdate.role = req.body.role;
    if (req.body.avatar) fieldsToUpdate.avatar = req.body.avatar;
    if (typeof req.body.isActive !== 'undefined') fieldsToUpdate.isActive = req.body.isActive;
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
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
    
    await user.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
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
    await body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .run(req);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }
    
    // Update password
    user.password = req.body.password;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
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