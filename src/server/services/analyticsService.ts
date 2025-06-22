import { Task, User, Team, RecurringTask } from '../models';
import { AnalyticsData, IAnalyticsData, IMetricData, ITimeSeriesPoint } from '../models/AnalyticsData';

// Default cache validity duration - 24 hours
const DEFAULT_CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Date ranges for time-based analytics
export type DateRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface AnalyticsOptions {
  userId?: string;
  teamId?: string;
  startDate?: Date;
  endDate?: Date;
  dateRange?: DateRange;
  refreshCache?: boolean;
  includeTrends?: boolean;
}

/**
 * Service for calculating and retrieving analytics data
 */
class AnalyticsService {
  /**
   * Get user analytics data
   */
  public async getUserAnalytics(userId: string, options: AnalyticsOptions = {}): Promise<any> {
    // Set default options
    const opts = this.setDefaultOptions(options);
    
    // Try to find cached data if refresh is not requested
    if (!opts.refreshCache) {
      const cachedData = await AnalyticsData.findByUser(userId, 'tasks', { validOnly: true });
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Generate mock data for now
    // In a real implementation, we would query actual tasks and calculate metrics
    const metrics: IMetricData[] = [
      { name: 'taskCompletionRate', value: 85, unit: 'percent' },
      { name: 'overdueTasksPercentage', value: 15, unit: 'percent' },
      { name: 'averageCompletionTime', value: 24, unit: 'hours' },
    ];
    
    // Add task distribution by priority
    const tasksByPriority = {
      low: 10,
      medium: 25,
      high: 15,
      urgent: 5,
    };
    
    Object.entries(tasksByPriority).forEach(([priority, count]) => {
      metrics.push({
        name: `tasksByPriority.${priority}`,
        value: count as number,
        unit: 'count',
      });
    });
    
    // Add time series data if requested
    let time_series = undefined;
    if (opts.includeTrends) {
      const productivityTrend = this.generatePlaceholderTimeSeries(opts, 50, 100);
      time_series = [
        {
          name: 'productivityTrend',
          points: productivityTrend,
          interval: 'daily',
        },
      ];
    }
    
    // Save to cache
    const analyticsData = await AnalyticsData.create({
      user_id: userId,
      type: 'user',
      category: 'tasks',
      metrics,
      time_series,
      generated_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + DEFAULT_CACHE_DURATION_MS).toISOString(),
    });
    
    return analyticsData;
  }
  
  /**
   * Get team analytics data
   */
  public async getTeamAnalytics(teamId: string, options: AnalyticsOptions = {}): Promise<any> {
    // Set default options
    const opts = this.setDefaultOptions(options);
    
    // Try to find cached data if refresh is not requested
    if (!opts.refreshCache) {
      const cachedData = await AnalyticsData.findByTeam(teamId, 'performance', { validOnly: true });
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      throw new Error('Team not found');
    }
    
    // Generate mock data for now
    const metrics: IMetricData[] = [
      { name: 'teamCompletionRate', value: 78, unit: 'percent' },
      { name: 'teamEfficiencyScore', value: 82, unit: 'score' },
      {
        name: 'memberPerformance',
        value: 0,
        metadata: {
          memberStats: [
            { userId: "1", completionRate: 82, tasksCompleted: 24 },
            { userId: "2", completionRate: 75, tasksCompleted: 18 }
          ]
        }
      },
      {
        name: 'taskDistribution',
        value: 0,
        metadata: {
          byMember: { "1": 25, "2": 18 },
          byPriority: { low: 15, medium: 20, high: 8 }
        }
      }
    ];
    
    // Add time series data if requested
    let time_series = undefined;
    if (opts.includeTrends) {
      const teamProductivityTrend = this.generatePlaceholderTimeSeries(opts, 60, 95);
      time_series = [
        {
          name: 'teamProductivityTrend',
          points: teamProductivityTrend,
          interval: 'daily',
        },
      ];
    }
    
    // Save to cache
    const analyticsData = await AnalyticsData.create({
      team_id: teamId,
      type: 'team',
      category: 'performance',
      metrics,
      time_series,
      generated_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + DEFAULT_CACHE_DURATION_MS).toISOString(),
    });
    
    return analyticsData;
  }
  
  /**
   * Set default options for analytics
   */
  private setDefaultOptions(options: AnalyticsOptions): AnalyticsOptions {
    // Default to current date if not provided
    const now = new Date();
    
    // Copy options object
    const opts = { ...options };
    
    // Set default date range if not provided
    if (!opts.dateRange) {
      opts.dateRange = 'week'; // Default to weekly analytics
    }
    
    // Set end date to now if not provided
    if (!opts.endDate) {
      opts.endDate = now;
    }
    
    // Calculate start date based on date range if not provided
    if (!opts.startDate) {
      opts.startDate = new Date(opts.endDate);
      
      // Adjust start date based on date range
      switch (opts.dateRange) {
        case 'day':
          opts.startDate.setDate(opts.startDate.getDate() - 1);
          break;
        case 'week':
          opts.startDate.setDate(opts.startDate.getDate() - 7);
          break;
        case 'month':
          opts.startDate.setMonth(opts.startDate.getMonth() - 1);
          break;
        case 'quarter':
          opts.startDate.setMonth(opts.startDate.getMonth() - 3);
          break;
        case 'year':
          opts.startDate.setFullYear(opts.startDate.getFullYear() - 1);
          break;
      }
    }
    
    return opts;
  }
  
  /**
   * Generate placeholder time series data
   */
  private generatePlaceholderTimeSeries(
    options: AnalyticsOptions,
    min: number = 0,
    max: number = 100
  ): ITimeSeriesPoint[] {
    const { startDate, endDate } = options;
    const points: ITimeSeriesPoint[] = [];
    
    const currentDate = new Date(startDate!);
    while (currentDate <= endDate!) {
      const value = min + Math.random() * (max - min);
      
      points.push({
        timestamp: currentDate.toISOString(),
        value: parseFloat(value.toFixed(2)),
        label: currentDate.toLocaleDateString(),
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return points;
  }
}

export default new AnalyticsService(); 