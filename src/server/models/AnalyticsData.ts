import { supabase } from '../config/database';
import { IUser } from './User';
import { ITeam } from './Team';

// Interface for different metric types
export interface IMetricData {
  name: string;
  value: number;
  unit?: string; // e.g., "percent", "days", "count"
  metadata?: Record<string, any>;
}

// Interface for time series data points
export interface ITimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

// Interface for analytics data document
export interface IAnalyticsData {
  id: string;
  user_id?: string;
  team_id?: string;
  type: 'user' | 'team' | 'system';
  category: 'tasks' | 'performance' | 'productivity' | 'engagement' | 'workload' | 'trends';
  metrics: IMetricData[];
  time_series?: {
    name: string;
    points: ITimeSeriesPoint[];
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
  }[];
  generated_at: string;
  valid_until: string; // Used for cache invalidation
  created_at: string;
  updated_at: string;
}

export class AnalyticsData {
  /**
   * Find analytics data by ID
   */
  static async findById(id: string): Promise<IAnalyticsData | null> {
    const { data, error } = await supabase
      .from('analytics_data')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !data) return null;
    return data as IAnalyticsData;
  }

  /**
   * Find analytics data for a specific user
   */
  static async findByUser(
    userId: string, 
    category: string, 
    options: { validOnly?: boolean } = {}
  ): Promise<IAnalyticsData | null> {
    let query = supabase
      .from('analytics_data')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'user')
      .eq('category', category)
      .order('generated_at', { ascending: false });
      
    if (options.validOnly) {
      const now = new Date().toISOString();
      query = query.gte('valid_until', now);
    }
    
    const { data, error } = await query.limit(1);
    
    if (error || !data || data.length === 0) return null;
    return data[0] as IAnalyticsData;
  }
  
  /**
   * Find analytics data for a specific team
   */
  static async findByTeam(
    teamId: string, 
    category: string, 
    options: { validOnly?: boolean } = {}
  ): Promise<IAnalyticsData | null> {
    let query = supabase
      .from('analytics_data')
      .select('*')
      .eq('team_id', teamId)
      .eq('type', 'team')
      .eq('category', category)
      .order('generated_at', { ascending: false });
      
    if (options.validOnly) {
      const now = new Date().toISOString();
      query = query.gte('valid_until', now);
    }
    
    const { data, error } = await query.limit(1);
    
    if (error || !data || data.length === 0) return null;
    return data[0] as IAnalyticsData;
  }
  
  /**
   * Find system analytics data
   */
  static async findSystemAnalytics(
    category: string, 
    options: { validOnly?: boolean } = {}
  ): Promise<IAnalyticsData | null> {
    let query = supabase
      .from('analytics_data')
      .select('*')
      .eq('type', 'system')
      .eq('category', category)
      .order('generated_at', { ascending: false });
      
    if (options.validOnly) {
      const now = new Date().toISOString();
      query = query.gte('valid_until', now);
    }
    
    const { data, error } = await query.limit(1);
    
    if (error || !data || data.length === 0) return null;
    return data[0] as IAnalyticsData;
  }
  
  /**
   * Create a new analytics data entry
   */
  static async create(analyticsData: Partial<IAnalyticsData>): Promise<IAnalyticsData | null> {
    const { data, error } = await supabase
      .from('analytics_data')
      .insert(analyticsData)
      .select()
      .single();
      
    if (error) {
      console.error('Error creating analytics data:', error);
      return null;
    }
    
    return data as IAnalyticsData;
  }
  
  /**
   * Update an analytics data entry
   */
  static async update(id: string, updateData: Partial<IAnalyticsData>): Promise<IAnalyticsData | null> {
    const { data, error } = await supabase
      .from('analytics_data')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating analytics data:', error);
      return null;
    }
    
    return data as IAnalyticsData;
  }
  
  /**
   * Delete analytics data that are no longer valid
   */
  static async deleteExpired(): Promise<number> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('analytics_data')
      .delete()
      .lt('valid_until', now)
      .select();
      
    if (error) {
      console.error('Error deleting expired analytics data:', error);
      return 0;
    }
    
    return data?.length || 0;
  }
} 