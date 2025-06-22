import jwt, { Secret } from 'jsonwebtoken';
import config from '../config/config';
import { supabase, supabaseAdmin } from '../config/database';
import bcrypt from 'bcrypt';

// Add notification preferences interface
export interface INotificationPreferences {
  emailDisabled?: string[]; // Array of notification types for which emails are disabled
  inAppDisabled?: string[]; // Array of notification types for which in-app notifications are disabled
  workingHours?: {
    start: string; // Format: "HH:MM" in 24h format
    end: string; // Format: "HH:MM" in 24h format
    timezone: string; // e.g., "America/New_York"
    enabledDays: number[]; // 0-6, where 0 is Sunday
  };
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'team_leader' | 'team_member';
  isActive: boolean;
  teamId?: string;
  notificationPreferences?: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  // Static methods for working with users via Supabase
  
  /**
   * Find user by ID
   */
  static async findById(id: string): Promise<IUser | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      
      // Get email from auth.users
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(id);
      
      if (userError || !userData.user) return null;

      return {
        id: data.id,
        name: data.name,
        email: userData.user.email || '',
        avatar: data.avatar || undefined,
        role: data.role as 'admin' | 'user' | 'team_leader' | 'team_member',
        isActive: data.is_active,
        teamId: data.team_id || undefined,
        notificationPreferences: data.notification_preferences || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    try {
      // Find auth user by email
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: email
        }
      });

      if (userError || userData.users.length === 0) return null;
      
      const userId = userData.users[0].id;

      // Get profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) return null;
      
      return {
        id: data.id,
        name: data.name,
        email: email,
        avatar: data.avatar || undefined,
        role: data.role as 'admin' | 'user' | 'team_leader' | 'team_member',
        isActive: data.is_active,
        teamId: data.team_id || undefined,
        notificationPreferences: data.notification_preferences || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Create new user
   */
  static async create(userData: {
    email: string;
    password: string;
    name: string;
    role?: 'admin' | 'user' | 'team_leader' | 'team_member';
  }): Promise<IUser | null> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.role || 'team_member'
        }
      });

      if (authError || !authData.user) {
        console.error('Error creating auth user:', authError);
        return null;
      }

      // Get the created profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching created profile:', profileError);
        return null;
      }

      return {
        id: profile.id,
        name: profile.name,
        email: userData.email,
        role: profile.role as 'admin' | 'user' | 'team_leader' | 'team_member',
        isActive: profile.is_active,
        teamId: profile.team_id || undefined,
        notificationPreferences: profile.notification_preferences || undefined,
        createdAt: new Date(profile.created_at),
        updatedAt: new Date(profile.updated_at)
      };
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  /**
   * Update user
   */
  static async update(userId: string, updateData: Partial<IUser>): Promise<IUser | null> {
    try {
      // Format data for Supabase column naming
      const profileData: any = {
        name: updateData.name,
        avatar: updateData.avatar,
        role: updateData.role,
        is_active: updateData.isActive,
        team_id: updateData.teamId,
        notification_preferences: updateData.notificationPreferences,
        updated_at: new Date().toISOString()
      };

      // Remove undefined fields
      Object.keys(profileData).forEach(key => {
        if (profileData[key] === undefined) delete profileData[key];
      });

      // Update profile
      const { data, error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId)
        .select('*')
        .single();

      if (error || !data) {
        console.error('Error updating user profile:', error);
        return null;
      }
      
      // Get email
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userError) return null;

      return {
        id: data.id,
        name: data.name,
        email: userData.user?.email || '',
        avatar: data.avatar || undefined,
        role: data.role as 'admin' | 'user' | 'team_leader' | 'team_member',
        isActive: data.is_active,
        teamId: data.team_id || undefined,
        notificationPreferences: data.notification_preferences || undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  /**
   * Generate JWT auth token
   */
  static generateAuthToken(user: IUser): string {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    const secret: Secret = config.jwtSecret;
    const options: jwt.SignOptions = { 
      expiresIn: typeof config.jwtExpire === 'string' ? config.jwtExpire : String(config.jwtExpire)
    };
    
    return jwt.sign(payload, secret, options);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(user: IUser): string {
    const payload = {
      id: user.id,
    };
    
    const secret: Secret = config.jwtSecret;
    const options: jwt.SignOptions = { 
      expiresIn: '7d'
    };
    
    return jwt.sign(payload, secret, options);
  }

  /**
   * Reset password
   */
  static async resetPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );
      
      return !error;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }

  /**
   * Delete user
   */
  static async delete(userId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      return !error;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }
}

export default User; 