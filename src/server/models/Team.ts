import { supabase } from '../config/database';
import { IUser } from './User';

export interface ITeam {
  id: string;
  name: string;
  description: string;
  leader_id: string;
  co_leaders: string[];
  created_at: string;
  updated_at: string;
}

export interface ITeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'member' | 'co_leader' | 'leader';
  created_at: string;
}

export class Team {
  /**
   * Find team by ID
   */
  static async findById(id: string): Promise<ITeam | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data as ITeam;
    } catch (error) {
      console.error('Error finding team by ID:', error);
      return null;
    }
  }

  /**
   * Create new team
   */
  static async create(teamData: {
    name: string;
    description: string;
    leaderId: string;
  }): Promise<ITeam | null> {
    try {
      // Start a transaction using Supabase's native PostgreSQL functions
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          leader_id: teamData.leaderId,
          co_leaders: []
        })
        .select()
        .single();

      if (teamError || !teamData) {
        console.error('Error creating team:', teamError);
        return null;
      }

      // Add leader to team_members table
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: teamData.leader_id,
          role: 'leader'
        });

      if (memberError) {
        console.error('Error adding team leader as member:', memberError);
        // Try to clean up the team we just created
        await supabase.from('teams').delete().eq('id', teamData.id);
        return null;
      }

      // Update user's teamId in profiles
      const { error: userError } = await supabase
        .from('profiles')
        .update({ team_id: teamData.id, role: 'team_leader' })
        .eq('id', teamData.leader_id);

      if (userError) {
        console.error('Error updating leader profile:', userError);
      }

      return teamData as ITeam;
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  }

  /**
   * Update team
   */
  static async update(id: string, updateData: Partial<ITeam>): Promise<ITeam | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating team:', error);
        return null;
      }

      return data as ITeam;
    } catch (error) {
      console.error('Error updating team:', error);
      return null;
    }
  }

  /**
   * Delete team
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // Get team members to update their profiles
      const { data: members } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', id);

      if (members && members.length > 0) {
        // Reset team_id for all members
        const userIds = members.map(member => member.user_id);
        await supabase
          .from('profiles')
          .update({ team_id: null, role: 'user' })
          .in('id', userIds);
      }

      // Delete team_members
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', id);

      // Delete team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting team:', error);
      return false;
    }
  }

  /**
   * Get team members
   */
  static async getMembers(teamId: string): Promise<IUser[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      if (error || !data || data.length === 0) return [];

      const userIds = data.map(member => member.user_id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profilesError || !profiles) return [];

      // We need to fetch emails from auth.users
      // This requires using the admin client and may not be directly available
      // We'll work with the information we have from profiles

      return profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        email: '', // Email would need to be fetched separately
        avatar: profile.avatar,
        role: profile.role,
        isActive: profile.is_active,
        teamId: profile.team_id,
        notificationPreferences: profile.notification_preferences,
        createdAt: new Date(profile.created_at),
        updatedAt: new Date(profile.updated_at)
      }));
    } catch (error) {
      console.error('Error getting team members:', error);
      return [];
    }
  }

  /**
   * Add member to team
   */
  static async addMember(teamId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is already in the team
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        return true; // User already in team
      }

      // Add user to team_members
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: 'member'
        });

      if (memberError) {
        console.error('Error adding member to team:', memberError);
        return false;
      }

      // Update user's teamId in profiles
      const { error: userError } = await supabase
        .from('profiles')
        .update({ team_id: teamId, role: 'team_member' })
        .eq('id', userId);

      if (userError) {
        console.error('Error updating user profile:', userError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding member to team:', error);
      return false;
    }
  }

  /**
   * Remove member from team
   */
  static async removeMember(teamId: string, userId: string): Promise<boolean> {
    try {
      // Remove user from team_members
      const { error: memberError } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (memberError) {
        console.error('Error removing member from team:', memberError);
        return false;
      }

      // Update user's profile
      const { error: userError } = await supabase
        .from('profiles')
        .update({ team_id: null, role: 'user' })
        .eq('id', userId);

      if (userError) {
        console.error('Error updating user profile:', userError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing member from team:', error);
      return false;
    }
  }
}