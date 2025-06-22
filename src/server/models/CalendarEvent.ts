import { supabase } from '../config/database';

export type EventType = 'meeting' | 'deadline' | 'task' | 'event' | 'maintenance' | 'audit' | 'hr';
export type EventPriority = 'high' | 'medium' | 'low';
export type EventStatus = 'confirmed' | 'tentative' | 'cancelled';

export interface ICalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  duration?: number;
  type: EventType;
  priority?: EventPriority;
  impact?: EventPriority;
  attendees?: string[];
  assignee_id?: string;
  assigned_by_id?: string;
  team_id?: string;
  task_id?: string;
  status?: EventStatus;
  created_at: string;
  updated_at: string;
}

export class CalendarEvent {
  /**
   * Find calendar event by ID
   */
  static async findById(id: string): Promise<ICalendarEvent | null> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data as ICalendarEvent;
    } catch (error) {
      console.error('Error finding calendar event by ID:', error);
      return null;
    }
  }

  /**
   * Create new calendar event
   */
  static async create(eventData: Partial<ICalendarEvent>): Promise<ICalendarEvent | null> {
    try {
      // Set default values
      const data = {
        ...eventData,
        status: eventData.status || 'confirmed',
        priority: eventData.priority || 'medium',
        type: eventData.type || 'event'
      };

      const { data: newEvent, error } = await supabase
        .from('calendar_events')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error creating calendar event:', error);
        return null;
      }

      return newEvent as ICalendarEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  /**
   * Update calendar event
   */
  static async update(id: string, updateData: Partial<ICalendarEvent>): Promise<ICalendarEvent | null> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating calendar event:', error);
        return null;
      }

      return data as ICalendarEvent;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return null;
    }
  }

  /**
   * Delete calendar event
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  /**
   * Get events by date range
   */
  static async getByDateRange(startDate: string, endDate: string): Promise<ICalendarEvent[]> {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error getting calendar events by date range:', error);
        return [];
      }

      return data as ICalendarEvent[];
    } catch (error) {
      console.error('Error getting calendar events by date range:', error);
      return [];
    }
  }

  /**
   * Get events by team
   */
  static async getByTeam(teamId: string, startDate?: string, endDate?: string): Promise<ICalendarEvent[]> {
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .eq('team_id', teamId);
      
      if (startDate) {
        query = query.gte('date', startDate);
      }
      
      if (endDate) {
        query = query.lte('date', endDate);
      }
      
      const { data, error } = await query.order('date', { ascending: true });

      if (error) {
        console.error('Error getting calendar events by team:', error);
        return [];
      }

      return data as ICalendarEvent[];
    } catch (error) {
      console.error('Error getting calendar events by team:', error);
      return [];
    }
  }

  /**
   * Get events by user
   */
  static async getByUser(userId: string, startDate?: string, endDate?: string): Promise<ICalendarEvent[]> {
    try {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .or(`assignee_id.eq.${userId},attendees.cs.{${userId}}`);
      
      if (startDate) {
        query = query.gte('date', startDate);
      }
      
      if (endDate) {
        query = query.lte('date', endDate);
      }
      
      const { data, error } = await query.order('date', { ascending: true });

      if (error) {
        console.error('Error getting calendar events by user:', error);
        return [];
      }

      return data as ICalendarEvent[];
    } catch (error) {
      console.error('Error getting calendar events by user:', error);
      return [];
    }
  }
}