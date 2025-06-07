import { User } from '../models';
import mongoose from 'mongoose';
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
    console.log(`Authentication attempt for: ${email} (password sanitized)`);
    
    // Normalize email to lowercase for case-insensitive matching
    const normalizedEmail = email.toLowerCase();
    
    try {
      // Use direct MongoDB access to bypass any Mongoose hooks
      const usersCollection = mongoose.connection.collection('users');
      
      // Find user directly from the collection
      const user = await usersCollection.findOne({ email: normalizedEmail });
      
      if (!user) {
        console.log(`User not found: ${email}`);
        return {
          success: false,
          message: 'Invalid credentials',
          statusCode: 401
        };
      }
      
      // Check if user is active
      if (!user.isActive) {
        console.log(`Inactive account: ${email}`);
        return {
          success: false,
          message: 'Account is disabled',
          statusCode: 403
        };
      }
      
      // Compare password directly using bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      console.log(`Password check for ${email}: ${isMatch ? 'match' : 'no match'}`);
      
      if (!isMatch) {
        console.log(`Failed login attempt for user: ${email} - Password mismatch`);
        return {
          success: false,
          message: 'Invalid credentials',
          statusCode: 401
        };
      }
      
      // Now get the user with Mongoose to use model methods
      const mongooseUser = await User.findById(user._id);
      
      if (!mongooseUser) {
        console.error('User found in direct DB but not in Mongoose');
        return {
          success: false,
          message: 'Authentication error',
          statusCode: 500
        };
      }
      
      // Generate tokens
      const token = mongooseUser.generateAuthToken();
      const refreshToken = mongooseUser.generateRefreshToken();
      
      // Update user last login directly through MongoDB to avoid hooks
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { lastLogin: new Date() } }
      );
      
      console.log(`Login successful for user: ${email}`);
      
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
      
    } catch (dbError) {
      console.error('Database error during authentication:', dbError);
      return {
        success: false,
        message: 'Authentication service error',
        statusCode: 500
      };
    }
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