import mongoose from 'mongoose';
import { Task, User, Team, RecurringTask } from '../models';
import { AnalyticsData, IAnalyticsData, IMetricData, ITimeSeriesPoint } from '../models/AnalyticsData';
import { clearEntityCache } from '../middleware/cacheMiddleware';

// Default cache validity duration - 24 hours
const DEFAULT_CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

// Date ranges for time-based analytics
export type DateRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface AnalyticsOptions {
  userId?: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
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
  public async getUserAnalytics(
    userId: mongoose.Types.ObjectId,
    options: AnalyticsOptions = {}
  ): Promise<any> {
    // Set default options
    const opts = this.setDefaultOptions(options);
    
    // Try to find cached data if refresh is not requested
    if (!opts.refreshCache) {
      const cachedData = await this.getCachedAnalytics('user', userId, undefined, 'tasks');
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Calculate core metrics
    const [
      taskCompletionRate,
      overdueTasksPercentage,
      avgCompletionTime,
      tasksByPriority,
    ] = await Promise.all([
      this.calculateTaskCompletionRate(userId),
      this.calculateOverdueTasksPercentage(userId),
      this.calculateAverageTaskCompletionTime(userId, opts),
      this.getTaskDistributionByPriority(userId),
    ]);
    
    // Build metrics array
    const metrics: IMetricData[] = [
      {
        name: 'taskCompletionRate',
        value: taskCompletionRate,
        unit: 'percent',
      },
      {
        name: 'overdueTasksPercentage',
        value: overdueTasksPercentage,
        unit: 'percent',
      },
      {
        name: 'averageCompletionTime',
        value: avgCompletionTime,
        unit: 'hours',
      },
    ];
    
    // Add task distribution by priority
    Object.entries(tasksByPriority).forEach(([priority, count]) => {
      metrics.push({
        name: `tasksByPriority.${priority}`,
        value: count as number,
        unit: 'count',
      });
    });
    
    // Add time series data if requested
    let timeSeries = undefined;
    if (opts.includeTrends) {
      const productivityTrend = await this.calculateProductivityTrend(userId, opts);
      timeSeries = [
        {
          name: 'productivityTrend',
          points: productivityTrend,
          interval: 'daily',
        },
      ];
    }
    
    // Save to cache
    const analyticsData = await this.saveAnalyticsToCache({
      user: userId,
      type: 'user',
      category: 'tasks',
      metrics,
      timeSeries,
    });
    
    return analyticsData;
  }
  
  /**
   * Get team analytics data
   */
  public async getTeamAnalytics(
    teamId: mongoose.Types.ObjectId,
    options: AnalyticsOptions = {}
  ): Promise<any> {
    // Set default options
    const opts = this.setDefaultOptions(options);
    
    // Try to find cached data if refresh is not requested
    if (!opts.refreshCache) {
      const cachedData = await this.getCachedAnalytics('team', undefined, teamId, 'performance');
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Get team data including members
    const team = await Team.findById(teamId).populate('members').populate('leader');
    if (!team) {
      throw new Error('Team not found');
    }
    
    // Calculate team metrics
    const [
      teamCompletionRate,
      teamEfficiencyScore,
      memberPerformance,
      taskDistribution,
    ] = await Promise.all([
      this.calculateTeamCompletionRate(teamId),
      this.calculateTeamEfficiencyScore(teamId),
      this.calculateTeamMemberPerformance(teamId),
      this.getTeamTaskDistribution(teamId),
    ]);
    
    // Build metrics array
    const metrics: IMetricData[] = [
      {
        name: 'teamCompletionRate',
        value: teamCompletionRate,
        unit: 'percent',
      },
      {
        name: 'teamEfficiencyScore',
        value: teamEfficiencyScore,
        unit: 'score',
      },
      {
        name: 'memberPerformance',
        value: 0, // Placeholder, actual data in metadata
        metadata: memberPerformance,
      },
      {
        name: 'taskDistribution',
        value: 0, // Placeholder, actual data in metadata
        metadata: taskDistribution,
      },
    ];
    
    // Add time series data if requested
    let timeSeries = undefined;
    if (opts.includeTrends) {
      const teamProductivityTrend = await this.calculateTeamProductivityTrend(teamId, opts);
      timeSeries = [
        {
          name: 'teamProductivityTrend',
          points: teamProductivityTrend,
          interval: 'daily',
        },
      ];
    }
    
    // Save to cache
    const analyticsData = await this.saveAnalyticsToCache({
      team: teamId,
      type: 'team',
      category: 'performance',
      metrics,
      timeSeries,
    });
    
    return analyticsData;
  }
  
  /**
   * Get system-wide analytics (admin only)
   */
  public async getSystemAnalytics(options: AnalyticsOptions = {}): Promise<any> {
    // Set default options
    const opts = this.setDefaultOptions(options);
    
    // Try to find cached data if refresh is not requested
    if (!opts.refreshCache) {
      const cachedData = await this.getCachedAnalytics('system', undefined, undefined, 'engagement');
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Calculate system metrics
    const [
      activeUsers,
      totalTasks,
      completionRate,
      averageTasksPerUser,
      userGrowth,
    ] = await Promise.all([
      this.calculateActiveUsers(opts),
      this.countTotalTasks(opts),
      this.calculateSystemCompletionRate(opts),
      this.calculateAverageTasksPerUser(opts),
      this.calculateUserGrowthRate(opts),
    ]);
    
    // Build metrics array
    const metrics: IMetricData[] = [
      {
        name: 'activeUsers',
        value: activeUsers,
        unit: 'count',
      },
      {
        name: 'totalTasks',
        value: totalTasks,
        unit: 'count',
      },
      {
        name: 'systemCompletionRate',
        value: completionRate,
        unit: 'percent',
      },
      {
        name: 'averageTasksPerUser',
        value: averageTasksPerUser,
        unit: 'count',
      },
      {
        name: 'userGrowthRate',
        value: userGrowth,
        unit: 'percent',
      },
    ];
    
    // Add time series data if requested
    let timeSeries = undefined;
    if (opts.includeTrends) {
      const [userActivityTrend, taskCreationTrend] = await Promise.all([
        this.calculateUserActivityTrend(opts),
        this.calculateTaskCreationTrend(opts),
      ]);
      
      timeSeries = [
        {
          name: 'userActivityTrend',
          points: userActivityTrend,
          interval: 'daily',
        },
        {
          name: 'taskCreationTrend',
          points: taskCreationTrend,
          interval: 'daily',
        },
      ];
    }
    
    // Save to cache
    const analyticsData = await this.saveAnalyticsToCache({
      type: 'system',
      category: 'engagement',
      metrics,
      timeSeries,
    });
    
    return analyticsData;
  }

  /**
   * Get task analytics data
   */
  public async getTaskAnalytics(options: AnalyticsOptions = {}): Promise<any> {
    // Set default options
    const opts = this.setDefaultOptions(options);
    
    // Try to find cached data if refresh is not requested
    if (!opts.refreshCache) {
      const cachedData = await this.getCachedAnalytics('system', undefined, undefined, 'tasks');
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Calculate task metrics
    const [
      taskCompletionByDay,
      taskCreationByPriority,
      averageCompletionTimeByPriority,
      recurringTaskEfficiency,
    ] = await Promise.all([
      this.calculateTaskCompletionByDay(opts),
      this.calculateTaskCreationByPriority(opts),
      this.calculateAverageCompletionTimeByPriority(opts),
      this.calculateRecurringTaskEfficiency(opts),
    ]);
    
    // Build metrics array for general task stats
    const metrics: IMetricData[] = [
      {
        name: 'taskCompletionByDay',
        value: 0, // Placeholder, actual data in metadata
        metadata: taskCompletionByDay,
      },
      {
        name: 'taskCreationByPriority',
        value: 0, // Placeholder, actual data in metadata
        metadata: taskCreationByPriority,
      },
      {
        name: 'averageCompletionTimeByPriority',
        value: 0, // Placeholder, actual data in metadata
        metadata: averageCompletionTimeByPriority,
      },
      {
        name: 'recurringTaskEfficiency',
        value: recurringTaskEfficiency,
        unit: 'percent',
      },
    ];
    
    // Add time series data if requested
    let timeSeries = undefined;
    if (opts.includeTrends) {
      const taskCompletionTrend = await this.calculateTaskCompletionTrend(opts);
      timeSeries = [
        {
          name: 'taskCompletionTrend',
          points: taskCompletionTrend,
          interval: 'daily',
        },
      ];
    }
    
    // Save to cache
    const analyticsData = await this.saveAnalyticsToCache({
      type: 'system',
      category: 'tasks',
      metrics,
      timeSeries,
    });
    
    return analyticsData;
  }

  /**
   * Get trend analytics over time
   */
  public async getTrendAnalytics(options: AnalyticsOptions = {}): Promise<any> {
    // Set default options with extended time range
    const opts = {
      ...this.setDefaultOptions(options),
      dateRange: options.dateRange || 'month',
      includeTrends: true,
    };
    
    // User-specific trends
    if (opts.userId) {
      return this.getUserTrendAnalytics(opts.userId, opts);
    }
    
    // Team-specific trends
    if (opts.teamId) {
      return this.getTeamTrendAnalytics(opts.teamId, opts);
    }
    
    // System-wide trends (default)
    return this.getSystemTrendAnalytics(opts);
  }
  
  // Private helper methods (to be implemented)
  
  private setDefaultOptions(options: AnalyticsOptions): AnalyticsOptions {
    const now = new Date();
    const defaultEndDate = new Date(now);
    
    let defaultStartDate: Date;
    if (options.dateRange === 'day') {
      defaultStartDate = new Date(now.setDate(now.getDate() - 1));
    } else if (options.dateRange === 'week') {
      defaultStartDate = new Date(now.setDate(now.getDate() - 7));
    } else if (options.dateRange === 'month') {
      defaultStartDate = new Date(now.setMonth(now.getMonth() - 1));
    } else if (options.dateRange === 'quarter') {
      defaultStartDate = new Date(now.setMonth(now.getMonth() - 3));
    } else if (options.dateRange === 'year') {
      defaultStartDate = new Date(now.setFullYear(now.getFullYear() - 1));
    } else {
      // Default to last 30 days
      defaultStartDate = new Date(now.setDate(now.getDate() - 30));
    }
    
    return {
      startDate: options.startDate || defaultStartDate,
      endDate: options.endDate || defaultEndDate,
      dateRange: options.dateRange || 'month',
      refreshCache: options.refreshCache || false,
      includeTrends: options.includeTrends || false,
      userId: options.userId,
      teamId: options.teamId,
    };
  }
  
  private async getCachedAnalytics(
    type: 'user' | 'team' | 'system',
    userId?: mongoose.Types.ObjectId,
    teamId?: mongoose.Types.ObjectId,
    category?: string
  ): Promise<IAnalyticsData | null> {
    const query: any = {
      type,
      validUntil: { $gt: new Date() },
    };
    
    if (userId) query.user = userId;
    if (teamId) query.team = teamId;
    if (category) query.category = category;
    
    return AnalyticsData.findOne(query)
      .sort({ generatedAt: -1 })
      .lean();
  }
  
  private async saveAnalyticsToCache(data: Partial<IAnalyticsData>): Promise<IAnalyticsData> {
    const now = new Date();
    const validUntil = new Date(now.getTime() + DEFAULT_CACHE_DURATION_MS);
    
    const analyticsData = new AnalyticsData({
      ...data,
      generatedAt: now,
      validUntil,
    });
    
    await analyticsData.save();
    
    // Clear any related cache
    await clearEntityCache('analytics');
    
    return analyticsData;
  }
  
  // Calculation methods for metrics - these would contain the actual implementation
  // For brevity, I'm adding placeholders that return mock values
  
  private async calculateTaskCompletionRate(userId: mongoose.Types.ObjectId): Promise<number> {
    // Implementation would query tasks and calculate actual rate
    return 75.5; // Example: 75.5% completion rate
  }
  
  private async calculateOverdueTasksPercentage(userId: mongoose.Types.ObjectId): Promise<number> {
    // Implementation would find overdue tasks and calculate percentage
    return 12.3; // Example: 12.3% overdue
  }
  
  private async calculateAverageTaskCompletionTime(
    userId: mongoose.Types.ObjectId,
    options: AnalyticsOptions
  ): Promise<number> {
    // Implementation would calculate actual average time
    return 18.5; // Example: 18.5 hours
  }
  
  private async getTaskDistributionByPriority(userId: mongoose.Types.ObjectId): Promise<Record<string, number>> {
    // Implementation would group tasks by priority
    return {
      low: 5,
      medium: 12,
      high: 8,
      urgent: 3,
    };
  }
  
  private async calculateProductivityTrend(
    userId: mongoose.Types.ObjectId,
    options: AnalyticsOptions
  ): Promise<ITimeSeriesPoint[]> {
    // Implementation would calculate daily productivity scores
    const trend: ITimeSeriesPoint[] = [];
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Generate placeholder data
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      trend.push({
        timestamp: date,
        value: 50 + Math.random() * 30, // Random value between 50-80
      });
    }
    
    return trend;
  }
  
  // Team analytics methods
  
  private async calculateTeamCompletionRate(teamId: mongoose.Types.ObjectId): Promise<number> {
    // Implementation would calculate team's task completion rate
    return 82.7; // Example: 82.7% completion rate
  }
  
  private async calculateTeamEfficiencyScore(teamId: mongoose.Types.ObjectId): Promise<number> {
    // Implementation would calculate efficiency based on multiple factors
    return 76.4; // Example: 76.4 efficiency score
  }
  
  private async calculateTeamMemberPerformance(teamId: mongoose.Types.ObjectId): Promise<any> {
    // Implementation would calculate performance metrics for each team member
    return {
      members: [
        { id: '1', name: 'User 1', completionRate: 85, tasksCompleted: 17 },
        { id: '2', name: 'User 2', completionRate: 72, tasksCompleted: 12 },
        // More team members...
      ],
    };
  }
  
  private async getTeamTaskDistribution(teamId: mongoose.Types.ObjectId): Promise<any> {
    // Implementation would analyze how tasks are distributed among team members
    return {
      even: 70, // Distribution evenness score
      maxLoad: 15, // Max tasks per member
      minLoad: 5, // Min tasks per member
    };
  }
  
  private async calculateTeamProductivityTrend(
    teamId: mongoose.Types.ObjectId,
    options: AnalyticsOptions
  ): Promise<ITimeSeriesPoint[]> {
    // Similar to user productivity trend but for teams
    const trend: ITimeSeriesPoint[] = [];
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      trend.push({
        timestamp: date,
        value: 60 + Math.random() * 25, // Random value between 60-85
      });
    }
    
    return trend;
  }
  
  // System analytics methods
  
  private async calculateActiveUsers(options: AnalyticsOptions): Promise<number> {
    // Implementation would count active users in the given period
    return 42; // Example: 42 active users
  }
  
  private async countTotalTasks(options: AnalyticsOptions): Promise<number> {
    // Implementation would count total tasks created in the period
    return 156; // Example: 156 total tasks
  }
  
  private async calculateSystemCompletionRate(options: AnalyticsOptions): Promise<number> {
    // Implementation would calculate system-wide completion rate
    return 73.8; // Example: 73.8% completion rate
  }
  
  private async calculateAverageTasksPerUser(options: AnalyticsOptions): Promise<number> {
    // Implementation would calculate average tasks per user
    return 12.4; // Example: 12.4 tasks per user
  }
  
  private async calculateUserGrowthRate(options: AnalyticsOptions): Promise<number> {
    // Implementation would calculate user growth rate
    return 5.7; // Example: 5.7% growth
  }
  
  private async calculateUserActivityTrend(options: AnalyticsOptions): Promise<ITimeSeriesPoint[]> {
    // Implementation would track user activity over time
    const trend: ITimeSeriesPoint[] = [];
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      trend.push({
        timestamp: date,
        value: 20 + Math.floor(Math.random() * 15), // Random value between 20-35
      });
    }
    
    return trend;
  }
  
  private async calculateTaskCreationTrend(options: AnalyticsOptions): Promise<ITimeSeriesPoint[]> {
    // Implementation would track task creation over time
    const trend: ITimeSeriesPoint[] = [];
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      trend.push({
        timestamp: date,
        value: 10 + Math.floor(Math.random() * 20), // Random value between 10-30
      });
    }
    
    return trend;
  }
  
  // Task analytics methods
  
  private async calculateTaskCompletionByDay(options: AnalyticsOptions): Promise<Record<string, number>> {
    // Implementation would analyze task completion patterns by day of week
    return {
      Monday: 25,
      Tuesday: 32,
      Wednesday: 30,
      Thursday: 28,
      Friday: 35,
      Saturday: 15,
      Sunday: 10,
    };
  }
  
  private async calculateTaskCreationByPriority(options: AnalyticsOptions): Promise<Record<string, number>> {
    // Implementation would count task creation by priority
    return {
      low: 45,
      medium: 68,
      high: 32,
      urgent: 11,
    };
  }
  
  private async calculateAverageCompletionTimeByPriority(options: AnalyticsOptions): Promise<Record<string, number>> {
    // Implementation would calculate average completion time by priority
    return {
      low: 72.5, // In hours
      medium: 48.2,
      high: 24.7,
      urgent: 8.3,
    };
  }
  
  private async calculateRecurringTaskEfficiency(options: AnalyticsOptions): Promise<number> {
    // Implementation would measure efficiency of recurring task completion
    return 84.3; // Example: 84.3% efficiency
  }
  
  private async calculateTaskCompletionTrend(options: AnalyticsOptions): Promise<ITimeSeriesPoint[]> {
    // Implementation would track task completion over time
    const trend: ITimeSeriesPoint[] = [];
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      trend.push({
        timestamp: date,
        value: 5 + Math.floor(Math.random() * 10), // Random value between 5-15
      });
    }
    
    return trend;
  }
  
  // Trend analytics methods
  
  private async getUserTrendAnalytics(
    userId: mongoose.Types.ObjectId,
    options: AnalyticsOptions
  ): Promise<any> {
    // Try to find cached data if refresh is not requested
    if (!options.refreshCache) {
      const cachedData = await this.getCachedAnalytics('user', userId, undefined, 'trends');
      if (cachedData) {
        return cachedData;
      }
    }
    
    // Calculate trend metrics for user
    const [
      completionRateTrend,
      taskCreationTrend,
      productivityScoreTrend,
    ] = await Promise.all([
      this.calculateUserCompletionRateTrend(userId, options),
      this.calculateUserTaskCreationTrend(userId, options),
      this.calculateUserProductivityScoreTrend(userId, options),
    ]);
    
    // Build metrics array (summary data)
    const metrics: IMetricData[] = [
      {
        name: 'avgCompletionRate',
        value: this.calculateAverageFromTimeSeries(completionRateTrend),
        unit: 'percent',
      },
      {
        name: 'taskCreationPace',
        value: this.calculateAverageFromTimeSeries(taskCreationTrend),
        unit: 'tasks_per_day',
      },
      {
        name: 'avgProductivityScore',
        value: this.calculateAverageFromTimeSeries(productivityScoreTrend),
        unit: 'score',
      },
    ];
    
    // Build time series data
    const timeSeries = [
      {
        name: 'completionRateTrend',
        points: completionRateTrend,
        interval: 'daily',
      },
      {
        name: 'taskCreationTrend',
        points: taskCreationTrend,
        interval: 'daily',
      },
      {
        name: 'productivityScoreTrend',
        points: productivityScoreTrend,
        interval: 'daily',
      },
    ];
    
    // Save to cache with longer duration for trends
    const analyticsData = await this.saveAnalyticsToCache({
      user: userId,
      type: 'user',
      category: 'trends',
      metrics,
      timeSeries,
    });
    
    return analyticsData;
  }
  
  private async getTeamTrendAnalytics(
    teamId: mongoose.Types.ObjectId,
    options: AnalyticsOptions
  ): Promise<any> {
    // Implementation similar to user trends but for team level
    // (Placeholder implementation for brevity)
    return { /* team trend data */ };
  }
  
  private async getSystemTrendAnalytics(options: AnalyticsOptions): Promise<any> {
    // Implementation for system-wide trends
    // (Placeholder implementation for brevity)
    return { /* system trend data */ };
  }
  
  // Helper methods for trend calculations
  
  private async calculateUserCompletionRateTrend(
    userId: mongoose.Types.ObjectId,
    options: AnalyticsOptions
  ): Promise<ITimeSeriesPoint[]> {
    // Implementation would calculate completion rate over time
    // (Placeholder implementation for brevity)
    return this.generatePlaceholderTimeSeries(options, 60, 100);
  }
  
  private async calculateUserTaskCreationTrend(
    userId: mongoose.Types.ObjectId,
    options: AnalyticsOptions
  ): Promise<ITimeSeriesPoint[]> {
    // Implementation would track task creation over time
    // (Placeholder implementation for brevity)
    return this.generatePlaceholderTimeSeries(options, 0, 10);
  }
  
  private async calculateUserProductivityScoreTrend(
    userId: mongoose.Types.ObjectId,
    options: AnalyticsOptions
  ): Promise<ITimeSeriesPoint[]> {
    // Implementation would calculate productivity score over time
    // (Placeholder implementation for brevity)
    return this.generatePlaceholderTimeSeries(options, 50, 100);
  }
  
  private calculateAverageFromTimeSeries(points: ITimeSeriesPoint[]): number {
    if (!points.length) return 0;
    
    const sum = points.reduce((total, point) => total + point.value, 0);
    return Number((sum / points.length).toFixed(2));
  }
  
  private generatePlaceholderTimeSeries(
    options: AnalyticsOptions,
    min: number = 0,
    max: number = 100
  ): ITimeSeriesPoint[] {
    const result: ITimeSeriesPoint[] = [];
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate || new Date();
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      result.push({
        timestamp: date,
        value: min + Math.random() * (max - min),
      });
    }
    
    return result;
  }
}

// Export a singleton instance
export const analyticsService = new AnalyticsService();

export default analyticsService; 