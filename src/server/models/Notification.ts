import { supabase } from '../config/database';

// Define notification types
export type NotificationType = 
  'TaskAssigned' | 
  'TaskDue' |
  'TaskOverdue' |
  'MentionedInComment' |
  'TeamChanged' |
  'RecurringTaskGenerated' |
  'TeamMemberAdded' |
  'TeamMemberRemoved' |
  'TeamLeaderChanged';

// Define notification priority levels
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

// Reference types for polymorphic references
export type ReferenceType = 'Task' | 'Team' | 'User' | 'Comment' | 'RecurringTask';

// Interface for notification references (polymorphic)
export interface INotificationReference {
  ref_type: ReferenceType;
  ref_id: string;
}

// Base notification interface
export interface INotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  read: boolean;
  read_at?: string;
  reference?: INotificationReference; // Polymorphic reference
  related_refs?: INotificationReference[]; // Additional related references
  data?: Record<string, any>; // Additional data specific to notification type
  email_sent: boolean;
  email_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export class Notification {
  /**
   * Find notification by ID
   */
  static async findById(id: string): Promise<INotification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data as INotification;
    } catch (error) {
      console.error('Error finding notification by ID:', error);
      return null;
    }
  }

  /**
   * Create new notification
   */
  static async create(notificationData: Partial<INotification>): Promise<INotification | null> {
    try {
      const data = {
        ...notificationData,
        read: notificationData.read ?? false,
        email_sent: notificationData.email_sent ?? false,
        priority: notificationData.priority || 'normal'
      };

      const { data: newNotification, error } = await supabase
        .from('notifications')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return newNotification as INotification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Update notification
   */
  static async update(id: string, updateData: Partial<INotification>): Promise<INotification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating notification:', error);
        return null;
      }

      return data as INotification;
    } catch (error) {
      console.error('Error updating notification:', error);
      return null;
    }
  }

  /**
   * Delete notification
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(id: string): Promise<INotification | null> {
    return await Notification.update(id, {
      read: true,
      read_at: new Date().toISOString()
    });
  }

  /**
   * Get notifications by user
   */
  static async getByUser(
    userId: string, 
    options: { 
      read?: boolean, 
      limit?: number, 
      offset?: number 
    } = {}
  ): Promise<INotification[]> {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);
      
      if (options.read !== undefined) {
        query = query.eq('read', options.read);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      if (error) {
        console.error('Error getting notifications by user:', error);
        return [];
      }

      return data as INotification[];
    } catch (error) {
      console.error('Error getting notifications by user:', error);
      return [];
    }
  }

  /**
   * Get notifications by reference
   */
  static async getByReference(refType: ReferenceType, refId: string): Promise<INotification[]> {
    try {
      // Query using reference JSON fields
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`reference->ref_type.eq.${refType},reference->ref_id.eq.${refId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting notifications by reference:', error);
        return [];
      }

      return data as INotification[];
    } catch (error) {
      console.error('Error getting notifications by reference:', error);
      return [];
    }
  }

  /**
   * Mark all user's notifications as read
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: now
        })
        .eq('user_id', userId)
        .eq('read', false);

      return !error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Get unread count for user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Error getting unread notification count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }
} 