import { User } from './auth';
import { Task } from './task';

/**
 * Common API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  pages?: number;
}

/**
 * Paginated API response
 */
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

/**
 * Auth API responses
 */
export interface LoginResponse {
  token: string;
  user: User;
}

export interface RefreshTokenResponse {
  token: string;
}

/**
 * Task API responses
 */
export interface TasksResponse {
  tasks: Task[];
  pagination: PaginationMeta;
}

export interface TaskResponse {
  task: Task;
}

/**
 * User API responses
 */
export interface UsersResponse {
  users?: User[];
  data?: User[];
  pagination: PaginationMeta;
}

export interface UserResponse {
  user: User;
}

/**
 * Team API responses
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamsResponse {
  teams: Team[];
  pagination: PaginationMeta;
}

export interface TeamResponse {
  team: Team;
}

/**
 * Analytics API responses
 */
export interface AnalyticsData {
  taskCompletionRate: number;
  tasksCompleted: number;
  tasksCreated: number;
  activeUsers: number;
  timeframeStart: string;
  timeframeEnd: string;
  tasksPending?: number;
  tasksOverdue?: number;
  userGrowthRate?: number;
  newTeamsThisWeek?: number;
  recentActivities?: Array<{
    userName?: string;
    action?: string;
    subject?: string;
    timeAgo?: string;
  }>;
}

export interface AnalyticsResponse {
  data: AnalyticsData;
}

/**
 * Notification API responses
 */
export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  pagination: PaginationMeta;
}

/**
 * Recurring Task API responses
 */
export interface RecurringTask {
  id: string;
  title: string;
  description?: string;
  assigneeId?: string;
  teamId?: string;
  priority: 'low' | 'medium' | 'high';
  schedule: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    interval?: number;
    weekdays?: number[];
    monthDays?: number[];
    startDate: string;
    endDate?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastTaskCreated?: string;
}

export interface RecurringTasksResponse {
  recurringTasks: RecurringTask[];
  pagination: PaginationMeta;
}

export interface RecurringTaskResponse {
  recurringTask: RecurringTask;
} 