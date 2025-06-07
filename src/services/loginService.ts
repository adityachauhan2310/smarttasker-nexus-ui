import { User } from '../models';
import bcrypt from 'bcrypt';
import config from '../config/config';
import { sanitizeRequestData } from '../utils/securityUtils';

interface LoginResult {
  success: boolean;
  user?: any;
  token?: string;
  refreshToken?: string;
  message?: string;
  statusCode: number;
}

/**
 * Handle user authentication
 * @param email User email
 * @param password User password
 * @returns Login result with tokens and user data
 */
export const authenticateUser = async (email: string, password: string): Promise<LoginResult> => {
  try {
    // Log attempt with sanitized credentials
    console.log(`Authentication attempt for: ${sanitizeRequestData({ email })}`);
    
    // Check if user exists
    const user = await User.findOne({ email }).select('+password');

    // If no user found, return error
    if (!user) {
      return {
        success: false,
        message: 'Invalid credentials',
        statusCode: 401
      };
    }

    // If user exists but is not active
    if (!user.isActive) {
      return {
        success: false,
        message: 'Account is disabled',
        statusCode: 403
      };
    }
    
    // Check if password matches using bcrypt directly to avoid potential hooks
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log(`Failed login attempt for user: ${email} - Password mismatch`);
      return {
        success: false,
        message: 'Invalid credentials',
        statusCode: 401
      };
    }
    
    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    
    // Update user last login and save
    user.lastLogin = new Date();
    await user.save();
    
    // Return success with user data and tokens
    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
      refreshToken,
      statusCode: 200
    };
  } catch (error) {
    // Log error without exposing sensitive data
    console.error('Login error:', error instanceof Error ? error.message : 'Unknown error');
    
    return {
      success: false,
      message: 'Authentication failed',
      statusCode: 500
    };
  }
} 