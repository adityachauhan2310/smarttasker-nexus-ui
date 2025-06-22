import { supabase } from '../config/database';
import { IUser } from './User';

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IComment {
  id: string;
  user_id: string;
  task_id: string;
  text: string;
  created_at: string;
}

export interface ITask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
  created_by: string;
  assigned_to: string | null;
  tags: string[];
  recurring_task_id?: string;
  completed_at?: string;
  estimated_time?: number; // In minutes
  actual_time?: number; // In minutes
  notifications_sent?: {
    due_soon?: string;
    overdue?: string;
    reminders?: string[];
  }; // Track notifications sent
  created_at: string;
  updated_at: string;
}

// Helper class to handle Task operations with Supabase
export class Task {
  /**
   * Find task by ID
   */
  static async findById(id: string): Promise<ITask | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data as ITask;
    } catch (error) {
      console.error('Error finding task by ID:', error);
      return null;
    }
  }

  /**
   * Create new task
   */
  static async create(taskData: Partial<ITask>): Promise<ITask | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return null;
      }

      return data as ITask;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  /**
   * Update task
   */
  static async update(id: string, updateData: Partial<ITask>): Promise<ITask | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return null;
      }

      return data as ITask;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  /**
   * Delete task
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting task:', error);
      return false;
    }
  }

  /**
   * Mark task as complete
   */
  static async markComplete(id: string): Promise<ITask | null> {
    return await Task.update(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  }

  /**
   * Reassign task to a user
   */
  static async reassign(id: string, userId: string | null): Promise<ITask | null> {
    try {
      // Get current task status
      const currentTask = await Task.findById(id);
      if (!currentTask) return null;

      const updateData: Partial<ITask> = {
        assigned_to: userId,
      };

      // If it was completed and reassigned, set to in_progress
      if (currentTask.status === 'completed' && userId) {
        updateData.status = 'in_progress';
        updateData.completed_at = undefined;
      }

      return await Task.update(id, updateData);
    } catch (error) {
      console.error('Error reassigning task:', error);
      return null;
    }
  }

  /**
   * Add comment to task
   */
  static async addComment(taskId: string, userId: string, text: string): Promise<IComment | null> {
    try {
      const commentData = {
        task_id: taskId,
        user_id: userId,
        text: text,
      };

      const { data, error } = await supabase
        .from('task_comments')
        .insert(commentData)
        .select()
        .single();

      if (error) {
        console.error('Error adding comment:', error);
        return null;
      }

      return data as IComment;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  }

  /**
   * Get comments for a task
   */
  static async getComments(taskId: string): Promise<IComment[]> {
    try {
      const { data, error } = await supabase
        .from('task_comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error getting comments:', error);
        return [];
      }

      return data as IComment[];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  /**
   * Find tasks that are due soon
   */
  static async findDueSoon(nowStr: string, targetTimeStr: string, oneDayAgoStr: string): Promise<{ data: ITask[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, assigned_to, notifications_sent')
        .neq('status', 'completed')
        .gt('due_date', nowStr)
        .lte('due_date', targetTimeStr)
        .or(`notifications_sent->due_soon.is.null,notifications_sent->due_soon.lt.${oneDayAgoStr}`);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as ITask[], error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  /**
   * Find overdue tasks
   */
  static async findOverdue(nowStr: string, oneDayAgoStr: string): Promise<{ data: ITask[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, assigned_to, notifications_sent')
        .neq('status', 'completed')
        .lt('due_date', nowStr)
        .or(`notifications_sent->overdue.is.null,notifications_sent->overdue.lt.${oneDayAgoStr}`);

      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as ITask[], error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }

  /**
   * Get user details for notifications
   */
  static async getUserDetails(userId: string): Promise<{ data: any; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', userId)
        .single();
      
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }
}