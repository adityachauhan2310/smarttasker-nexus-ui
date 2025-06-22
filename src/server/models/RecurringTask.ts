import { supabase } from '../config/database';
import { ITask, TaskPriority } from './Task';

// Define the frequency types for recurring tasks
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// Weekday type (0-6, where 0 is Sunday)
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface IRecurringTask {
  id: string;
  title: string;
  description?: string;
  frequency: RecurringFrequency;
  interval: number; // e.g., every 2 days, 3 weeks, 1 month
  days_of_week?: Weekday[]; // For weekly tasks, which days of week (0-6)
  day_of_month?: number; // For monthly tasks (1-31, or -1 for last day)
  start_date: string; // ISO date string
  end_date?: string; // ISO date string
  max_occurrences?: number;
  tasks_generated: number; // Count of tasks generated so far
  skip_weekends: boolean; // Whether to skip weekend dates
  skip_holidays: boolean; // Whether to skip holidays
  skip_dates: string[]; // Specific dates to skip (ISO date strings)
  last_generated_date?: string; // ISO date string
  next_generation_date?: string; // ISO date string
  paused: boolean; // Whether the recurring task is paused
  created_by: string; // User ID
  team_id?: string; // Optional team association
  
  // Task template properties
  task_template: {
    title: string; // Can use variables like {{date}}, {{count}}
    description?: string;
    priority: TaskPriority;
    assigned_to?: string; // User ID
    estimated_time?: number; // In minutes
    tags: string[];
  };
  
  created_at: string;
  updated_at: string;
}

export class RecurringTask {
  /**
   * Find recurring task by ID
   */
  static async findById(id: string): Promise<IRecurringTask | null> {
    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return data as IRecurringTask;
    } catch (error) {
      console.error('Error finding recurring task by ID:', error);
      return null;
    }
  }

  /**
   * Create new recurring task
   */
  static async create(taskData: Partial<IRecurringTask>): Promise<IRecurringTask | null> {
    try {
      // Set default values if not provided
      const data = {
        ...taskData,
        tasks_generated: taskData.tasks_generated || 0,
        paused: taskData.paused ?? false,
        skip_weekends: taskData.skip_weekends ?? false,
        skip_holidays: taskData.skip_holidays ?? false,
        skip_dates: taskData.skip_dates || []
      };

      const { data: newTask, error } = await supabase
        .from('recurring_tasks')
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error('Error creating recurring task:', error);
        return null;
      }

      return newTask as IRecurringTask;
    } catch (error) {
      console.error('Error creating recurring task:', error);
      return null;
    }
  }

  /**
   * Update recurring task
   */
  static async update(id: string, updateData: Partial<IRecurringTask>): Promise<IRecurringTask | null> {
    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating recurring task:', error);
        return null;
      }

      return data as IRecurringTask;
    } catch (error) {
      console.error('Error updating recurring task:', error);
      return null;
    }
  }

  /**
   * Delete recurring task
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recurring_tasks')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting recurring task:', error);
      return false;
    }
  }

  /**
   * Pause a recurring task
   */
  static async pause(id: string): Promise<IRecurringTask | null> {
    return await RecurringTask.update(id, { paused: true });
  }

  /**
   * Resume a recurring task
   */
  static async resume(id: string): Promise<IRecurringTask | null> {
    return await RecurringTask.update(id, { paused: false });
  }

  /**
   * Calculate next occurrence date
   * This is a complex function that needs to be implemented based on 
   * the recurring pattern and skip rules
   */
  static calculateNextOccurrence(task: IRecurringTask, fromDate?: Date): Date {
    const currentDate = fromDate || (task.last_generated_date ? new Date(task.last_generated_date) : new Date());
    let nextDate = new Date(currentDate);
    
    // Add one day to start from the day after the last generation
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(0, 0, 0, 0); // Start of day
    
    // If using days of week, find the next matching day
    if (task.frequency === 'weekly' && task.days_of_week && task.days_of_week.length) {
      // Sort days to make search easier
      const sortedDays = [...task.days_of_week].sort((a, b) => a - b);
      
      // Look for the next day of week that matches
      let foundDay = false;
      let loopCount = 0; // Safety counter to prevent infinite loop
      const MAX_LOOPS = 7 * task.interval; // Maximum days to check
      
      while (!foundDay && loopCount < MAX_LOOPS) {
        const currentDayOfWeek = nextDate.getDay();
        
        // Check if current day is in our list of days
        if (sortedDays.includes(currentDayOfWeek as Weekday)) {
          foundDay = true;
        } else {
          // Move to next day
          nextDate.setDate(nextDate.getDate() + 1);
          loopCount++;
        }
      }
      
      // If we couldn't find a day, calculate based on interval
      if (!foundDay) {
        const startDay = new Date(task.start_date);
        const diffTime = Math.abs(nextDate.getTime() - startDay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const intervalDays = 7 * task.interval;
        const daysToAdd = intervalDays - (diffDays % intervalDays);
        
        nextDate.setDate(nextDate.getDate() + daysToAdd);
      }
    } else {
      // Handle non-weekly frequencies
      switch (task.frequency) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + task.interval - 1); // -1 because we already added one day
          break;
          
        case 'monthly':
          // Calculate for specific day of month
          nextDate.setDate(1); // First of month
          nextDate.setMonth(nextDate.getMonth() + task.interval); // Add interval months
          
          // Set to specific day of month
          if (task.day_of_month) {
            if (task.day_of_month === -1) {
              // Last day of month
              nextDate.setMonth(nextDate.getMonth() + 1);
              nextDate.setDate(0);
            } else {
              // Specific day of month
              // Ensure we don't exceed the days in the month
              const lastDayOfMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
              nextDate.setDate(Math.min(task.day_of_month, lastDayOfMonth));
            }
          }
          break;
          
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + task.interval);
          break;
      }
    }
    
    // Check if we should skip this date (weekend, holiday, or in skipDates)
    let skipped = RecurringTask.shouldSkipDate(task, nextDate);
    let safetyCounter = 0; // Prevent infinite loops
    
    while (skipped && safetyCounter < 100) { // Maximum 100 skips to prevent endless loop
      nextDate.setDate(nextDate.getDate() + 1);
      skipped = RecurringTask.shouldSkipDate(task, nextDate);
      safetyCounter++;
    }
    
    return nextDate;
  }

  /**
   * Check if a date should be skipped based on task rules
   */
  static shouldSkipDate(task: IRecurringTask, date: Date): boolean {
    // Check if the date is in the skip dates list
    if (task.skip_dates && task.skip_dates.length > 0) {
      const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      if (task.skip_dates.some(d => d.startsWith(dateString))) {
        return true;
      }
    }
    
    // Skip weekends if enabled
    if (task.skip_weekends) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday (0) or Saturday (6)
        return true;
      }
    }
    
    // Holidays would require an integration with a holiday service
    // This is a placeholder for that logic
    if (task.skip_holidays) {
      // Implementation would need a holiday service to check if date is a holiday
      // For now, we'll just return false
    }
    
    return false;
  }

  /**
   * Generate task data for a specific occurrence date
   */
  static generateTaskData(task: IRecurringTask, occurrenceDate: Date): Partial<ITask> {
    // Replace templates in title/description
    const templateVars = {
      date: occurrenceDate.toLocaleDateString(),
      count: (task.tasks_generated + 1).toString()
    };
    
    let title = task.task_template.title;
    let description = task.task_template.description || '';
    
    // Replace template variables
    Object.entries(templateVars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      title = title.replace(regex, value);
      description = description.replace(regex, value);
    });
    
    return {
      title,
      description,
      priority: task.task_template.priority,
      due_date: occurrenceDate.toISOString(),
      assigned_to: task.task_template.assigned_to,
      created_by: task.created_by,
      tags: task.task_template.tags || [],
      estimated_time: task.task_template.estimated_time,
      recurring_task_id: task.id,
      status: 'pending'
    };
  }

  /**
   * Find tasks that need to generate new occurrences
   */
  static async findTasksForGeneration(now: string): Promise<{ data: IRecurringTask[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('paused', false)
        .lte('next_generation_date', now);
        
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as IRecurringTask[], error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }
  
  /**
   * Find tasks without a next generation date
   */
  static async findTasksWithoutNextDate(): Promise<{ data: IRecurringTask[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('paused', false)
        .is('next_generation_date', null);
        
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as IRecurringTask[], error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }
  
  /**
   * Find tasks with maximum occurrence limits
   */
  static async findTasksWithLimits(): Promise<{ data: IRecurringTask[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('paused', false)
        .not('max_occurrences', 'is', null);
        
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as IRecurringTask[], error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }
  
  /**
   * Find tasks that have passed their end date
   */
  static async findTasksPastEndDate(now: string): Promise<{ data: IRecurringTask[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('recurring_tasks')
        .select('*')
        .eq('paused', false)
        .not('end_date', 'is', null)
        .lte('end_date', now);
        
      if (error) {
        return { data: null, error: new Error(error.message) };
      }
      
      return { data: data as IRecurringTask[], error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  }
  
  /**
   * Find tasks with various filters
   */
  static async findAll(filters: any = {}): Promise<{ data: IRecurringTask[] | null; error: any }> {
    try {
      let query = supabase.from('recurring_tasks').select('*');
      
      // Apply filters
      if (filters.paused !== undefined) {
        query = query.eq('paused', filters.paused);
      }
      
      if (filters.next_generation_date_before) {
        query = query.lte('next_generation_date', filters.next_generation_date_before);
      }
      
      if (filters.missing_next_generation_date) {
        query = query.is('next_generation_date', null);
      }
      
      if (filters.has_max_occurrences) {
        query = query.not('max_occurrences', 'is', null);
      }
      
      if (filters.end_date_before) {
        query = query.lte('end_date', filters.end_date_before);
      }
      
      const { data, error } = await query;
      return { data: data as IRecurringTask[], error };
    } catch (error) {
      return { data: null, error };
    }
  }
}