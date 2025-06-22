import { User } from '../models';
import { supabaseAdmin } from '../config/database';
import config from '../config/config';
import { sanitizeRequestData } from '../utils/securityUtils';
import { AuthError } from '@supabase/supabase-js';

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
      // Authenticate with Supabase
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email: normalizedEmail,
        password: password
      });
      
      if (error) {
        console.log(`Authentication failed: ${error.message}`);
        
        if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            message: 'Email not confirmed',
            statusCode: 403
          };
        }
        
        return {
          success: false,
          message: 'Invalid credentials',
          statusCode: 401
        };
      }
      
      if (!data || !data.user || !data.session) {
        console.log('No user data returned from Supabase');
        return {
          success: false,
          message: 'Invalid credentials',
          statusCode: 401
        };
      }
      
      // Get user profile data
      const userProfile = await User.findById(data.user.id);
      
      if (!userProfile) {
        console.error('User found in auth but not in profiles');
        return {
          success: false,
          message: 'Authentication error',
          statusCode: 500
        };
      }
      
      // Check if user is active
      if (!userProfile.isActive) {
        console.log(`Inactive account: ${email}`);
        return {
          success: false,
          message: 'Account is disabled',
          statusCode: 403
        };
      }
      
      // Generate custom token (optional, since Supabase already provides tokens)
      // const token = User.generateAuthToken(userProfile);
      
      console.log(`Login successful for user: ${email}`);
      
      // Return success with user data and tokens from Supabase
      return {
        success: true,
        user: {
          id: userProfile.id,
          name: userProfile.name,
          email: data.user.email,
          role: userProfile.role,
          avatar: userProfile.avatar,
        },
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
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