import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models';
import config from '../config/config';
import { ErrorResponse } from '../middleware/errorMiddleware';
import { authenticateUser } from '../services/loginService';

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Validate request
    await Promise.all([
      body('email').isEmail().withMessage('Please provide a valid email').run(req),
      body('password').notEmpty().withMessage('Password is required').run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Login validation failed:', errors.array());
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    console.log(`Login attempt for ${email} from ${req.ip}`);

    // Use login service for authentication
    const result = await authenticateUser(email, password);

    console.log(`Authentication result for ${email}:`, { success: result.success, statusCode: result.statusCode });

    // If authentication failed, return the error
    if (!result.success) {
      res.status(result.statusCode).json({
        success: false,
        message: result.message
      });
      return;
    }

    // Set cookies
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: config.env === 'production',
      maxAge: 60 * 60 * 1000, // 1 hour
      sameSite: 'lax',
      path: '/'
    });
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: config.env === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax',
      path: '/'
    });

    console.log(`Login successful for ${email}, sending response`);

    // Send response
    res.status(200).json({
      success: true,
      data: {
        user: result.user,
        token: result.token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      next(new ErrorResponse('Not authorized', 401));
      return;
    }
    
    // Find user and remove refresh token
    const user = await User.findById(req.user._id);
    
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    // Clear cookies
    res.clearCookie('token');
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public (with refresh token)
 */
export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get refresh token from cookie
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      next(new ErrorResponse('Refresh token not found', 401));
      return;
    }
    // Verify refresh token (handled in middleware)
    // If valid, middleware will set a new token cookie and send response
    // Instead, let's generate and set a new token here for clarity
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { id: string };
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      next(new ErrorResponse('Invalid refresh token', 401));
      return;
    }
    // Generate new auth token
    const newToken = user.generateAuthToken();
    // Set new token in cookie
    res.cookie('token', newToken, {
      httpOnly: true,
      secure: config.env === 'production',
      maxAge: 60 * 60 * 1000, // 1 hour
      sameSite: 'lax',
      path: '/',
    });
    res.status(200).json({
      success: true,
      token: newToken,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      next(new ErrorResponse('Not authorized', 401));
      return;
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        notificationPreferences: user.notificationPreferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      next(new ErrorResponse('Not authorized', 401));
      return;
    }

    // Validate request
    await Promise.all([
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').run(req),
      body('email').optional().isEmail().withMessage('Please provide a valid email').run(req),
      body('notificationPreferences').optional().isObject().withMessage('Invalid notification preferences').run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const { name, email, notificationPreferences } = req.body;

    // Check if email is already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        next(new ErrorResponse('Email already in use', 400));
        return;
      }
    }

    // Update user
    const fieldsToUpdate: any = {};
    
    if (name) fieldsToUpdate.name = name;
    if (email) fieldsToUpdate.email = email;
    if (notificationPreferences) {
      fieldsToUpdate.notificationPreferences = {
        ...req.user.notificationPreferences,
        ...notificationPreferences,
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: {
        id: user?._id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        avatar: user?.avatar,
        notificationPreferences: user?.notificationPreferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      next(new ErrorResponse('Not authorized', 401));
      return;
    }

    // Validate request
    await Promise.all([
      body('currentPassword').notEmpty().withMessage('Current password is required').run(req),
      body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      next(new ErrorResponse('User not found', 404));
      return;
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      next(new ErrorResponse('Current password is incorrect', 401));
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  login,
  logout,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  changePassword,
}; 