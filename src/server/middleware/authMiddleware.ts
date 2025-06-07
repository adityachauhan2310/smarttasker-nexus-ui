import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';
import config from '../config/config';
import mongoose from 'mongoose';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and attaches user to request
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check if token is in the Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check if token is in cookies
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token, return unauthorized
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret) as {
        id: string;
        email: string;
        name: string;
        role: string;
      };

      // Find user by id
      const user = await User.findById(decoded.id);

      // Check if user exists
      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Attach user to request
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Role-based access control middleware
 * @param roles Array of allowed roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to access this route',
      });
      return;
    }

    // Check if user's role is allowed
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
      return;
    }

    next();
  };
};

/**
 * Refresh token middleware
 * Verifies refresh token and generates new access token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'No refresh token provided',
      });
      return;
    }

    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as { id: string };

      // Find user with this refresh token
      const user = await User.findById(decoded.id).select('+refreshToken');

      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token',
        });
        return;
      }

      // Generate new auth token
      const newToken = user.generateAuthToken();

      // Set new token in cookie
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: config.env === 'production',
        maxAge: 60 * 60 * 1000, // 1 hour
      });

      res.status(200).json({
        success: true,
        token: newToken,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error during token refresh',
    });
  }
};

export default { protect, authorize, refreshToken }; 