import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import apiClient from '../client/api/apiClient';
import { useToast } from './use-toast';
import {
  ApiResponse,
  PaginatedApiResponse,
  LoginResponse,
  TasksResponse,
  TaskResponse,
  UsersResponse,
  UserResponse,
  TeamsResponse,
  TeamResponse,
  RecurringTasksResponse,
  RecurringTaskResponse,
  AnalyticsResponse,
  NotificationsResponse,
  PaginationMeta
} from '../types/api';
import { User } from '../types/auth';
import axios from 'axios';

// ==== Auth Hooks ====
export const useLogin = (options: any = {}) => {
  const { toast } = useToast();
  
  return useMutation<
    ApiResponse<LoginResponse>,
    Error, 
    { email: string; password: string }
  >({
    mutationFn: async ({ email, password }) => {
      try {
        console.log('Attempting login with email:', email);
        
        // Add diagnostic logging for the request
        console.log('Login API URL:', `${apiClient.getConfig().baseURL}/auth/login`);
        console.log('withCredentials setting:', apiClient.getConfig().withCredentials);
        
        const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', { email, password });
        console.log('Login API response status:', response.status);
        console.log('Login API response headers:', response.headers);
        console.log('Login API response data:', response.data);
        
        // Check for success flag in the response
        if (!response.data?.success) {
          console.error('Login API returned success:false', response.data);
          throw new Error(response.data?.message || 'Login failed');
        }
        
        // Store token explicitly
        if (response.data.token) {
          apiClient.setAuthToken(response.data.token);
        }
        
        return response.data;
      } catch (error: any) {
        console.error('Login API error:', error);
        
        // Complete error diagnosis
        if (error?.code === 'ERR_NETWORK') {
          console.error('Network error during login - possible server down or CORS issue');
          throw new Error('Cannot connect to server. Please check your network connection and server status.');
        } else if (error?.response) {
          console.error('Server responded with error:', error.response.status, error.response.data);
          if (error.response.status === 401) {
            throw new Error('Invalid email or password');
          } else if (error.response.status === 403) {
            throw new Error('Account is disabled or you do not have permission to access this system');
          } else if (error.response.status === 429) {
            throw new Error('Too many login attempts. Please try again later.');
          } else if (error.response.status >= 500) {
            throw new Error('Server error. Please try again later or contact support.');
          } else {
            throw new Error(error?.response?.data?.message || 'Authentication failed. Please try again.');
          }
        } else {
          throw new Error(error?.message || 'Sign in failed. Please check your credentials and try again.');
        }
      }
    },
    onError: (error) => {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
    },
    ...options,
  });
};

export const useLogout = (options?: UseMutationOptions<ApiResponse<null>, Error, void>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
      return response.data;
    },
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
      apiClient.clearAuthToken();
    },
    ...options,
  });
};

export const useCurrentUser = (options?: UseQueryOptions<ApiResponse<UserResponse>, Error>) => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserResponse>>('/auth/me');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    ...options,
  });
};

// ==== Tasks Hooks ====
export const useTasks = (params?: { page?: number; limit?: number; status?: string; assignee?: string }, options?: UseQueryOptions<PaginatedApiResponse<TasksResponse>, Error>) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedApiResponse<TasksResponse>>('/tasks', { params });
      return response.data;
    },
    ...options,
  });
};

export const useTask = (taskId: string, options?: UseQueryOptions<ApiResponse<TaskResponse>, Error>) => {
  return useQuery({
    queryKey: ['tasks', taskId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<TaskResponse>>(`/tasks/${taskId}`);
      return response.data;
    },
    enabled: !!taskId,
    ...options,
  });
};

export const useCreateTask = (options?: UseMutationOptions<ApiResponse<TaskResponse>, Error, Record<string, any>>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (taskData) => {
      const response = await apiClient.post<ApiResponse<TaskResponse>>('/tasks', taskData);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate tasks query to refetch data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: 'Task Created',
        description: `Task "${data.data?.task.title}" was created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Create Task',
        description: error.message || 'An error occurred while creating the task.',
        variant: 'destructive',
      });
    },
    ...options,
  });
};

export const useUpdateTask = (options?: UseMutationOptions<ApiResponse<TaskResponse>, Error, { taskId: string; data: Record<string, any> }>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ taskId, data }) => {
      const response = await apiClient.put<ApiResponse<TaskResponse>>(`/tasks/${taskId}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific task query and tasks list
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: 'Task Updated',
        description: `Task was updated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Update Task',
        description: error.message || 'An error occurred while updating the task.',
        variant: 'destructive',
      });
    },
    ...options,
  });
};

export const useDeleteTask = (options?: UseMutationOptions<ApiResponse<null>, Error, string>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (taskId) => {
      const response = await apiClient.delete<ApiResponse<null>>(`/tasks/${taskId}`);
      return response.data;
    },
    onSuccess: (_, taskId) => {
      // Remove task from cache and invalidate tasks list
      queryClient.removeQueries({ queryKey: ['tasks', taskId] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      toast({
        title: 'Task Deleted',
        description: 'Task was deleted successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to Delete Task',
        description: error.message || 'An error occurred while deleting the task.',
        variant: 'destructive',
      });
    },
    ...options,
  });
};

// ==== Users Hooks ====
export interface UsersApiResponse {
  success: boolean;
  data: User[];
  pagination?: PaginationMeta;
  message?: string;
  errors?: Record<string, string[]>;
}

export const useUsers = (params?: { page?: number; limit?: number; search?: string; role?: string }, options?: UseQueryOptions<UsersApiResponse, Error>) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const response = await apiClient.get<any>('/users', { params });
      // Transform the response to match the expected format in the UserManagement component
      return {
        success: response.data.success,
        message: response.data.message,
        errors: response.data.errors,
        data: Array.isArray(response.data.data) ? response.data.data : [],
        pagination: response.data.pagination || {
          total: 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          pages: response.data.pagination?.pages || response.data.pagination?.totalPages || 1
        }
      } as UsersApiResponse;
    },
    ...options,
  });
};

export const useUser = (userId: string, options?: UseQueryOptions<ApiResponse<UserResponse>, Error>) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<UserResponse>>(`/users/${userId}`);
      return response.data;
    },
    enabled: !!userId,
    ...options,
  });
};

export const useCreateUser = (options?: UseMutationOptions<ApiResponse<UserResponse>, Error, any>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (userData: {
      name: string;
      email: string;
      password: string;
      role?: 'admin' | 'team_leader' | 'team_member';
      avatar?: string;
    }) => {
      const response = await apiClient.post<ApiResponse<UserResponse>>('/users', userData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "User created successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useUpdateUser = (options?: UseMutationOptions<ApiResponse<UserResponse>, Error, any>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      userData 
    }: { 
      userId: string; 
      userData: {
        name?: string;
        email?: string;
        role?: 'admin' | 'team_leader' | 'team_member';
        avatar?: string;
      }
    }) => {
      const response = await apiClient.put<ApiResponse<UserResponse>>(`/users/${userId}`, userData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
      toast({
        title: "Success",
        description: "User updated successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useDeleteUser = (options?: UseMutationOptions<ApiResponse<null>, Error, string>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete<ApiResponse<null>>(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "Success",
        description: "User deleted successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useToggleUserStatus = (options?: UseMutationOptions<ApiResponse<UserResponse>, Error, any>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      isActive 
    }: { 
      userId: string; 
      isActive: boolean 
    }) => {
      const response = await apiClient.put<ApiResponse<UserResponse>>(
        `/users/${userId}`, 
        { isActive }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
      const status = variables.isActive ? 'activated' : 'deactivated';
      toast({
        title: "Success",
        description: `User ${status} successfully`,
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useResetUserPassword = (options?: UseMutationOptions<ApiResponse<any>, Error, { userId: string; password: string }>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ userId, password }) => {
      const response = await apiClient.put<ApiResponse<any>>(`/users/${userId}/reset-password`, { password });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Password reset successfully',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      });
    },
    ...options,
  });
};

// ==== Teams Hooks ====
export const useTeams = (params?: { page?: number; limit?: number; search?: string }, options?: UseQueryOptions<PaginatedApiResponse<TeamsResponse>, Error>) => {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedApiResponse<TeamsResponse>>('/teams', { params });
      return response.data;
    },
    ...options,
  });
};

export const useTeam = (teamId: string, options?: UseQueryOptions<ApiResponse<TeamResponse>, Error>) => {
  return useQuery({
    queryKey: ['teams', teamId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<TeamResponse>>(`/teams/${teamId}`);
      return response.data;
    },
    enabled: !!teamId,
    ...options,
  });
};

export const useCreateTeam = (options?: UseMutationOptions<ApiResponse<TeamResponse>, Error, any>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (teamData: {
      name: string;
      description?: string;
      leader: string;
      members?: string[];
      coLeaders?: string[];
    }) => {
      console.log('API Call - Create Team:', teamData);
      const response = await apiClient.post<ApiResponse<TeamResponse>>('/teams', teamData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Success",
        description: "Team created successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      console.error('Team creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useUpdateTeam = (options?: UseMutationOptions<ApiResponse<TeamResponse>, Error, any>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      teamId, 
      teamData 
    }: { 
      teamId: string; 
      teamData: {
        name?: string;
        description?: string;
        leaderId?: string;
        memberIds?: string[];
      }
    }) => {
      const response = await apiClient.put<ApiResponse<TeamResponse>>(`/teams/${teamId}`, teamData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams', variables.teamId] });
      toast({
        title: "Success",
        description: "Team updated successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team",
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useDeleteTeam = (options?: UseMutationOptions<ApiResponse<null>, Error, string>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (teamId: string) => {
      const response = await apiClient.delete<ApiResponse<null>>(`/teams/${teamId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast({
        title: "Success",
        description: "Team deleted successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      });
    },
    ...options,
  });
};

// ==== Calendar Events Hooks ====
export interface CalendarEventData {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  duration?: number;
  type: 'meeting' | 'deadline' | 'task' | 'event' | 'maintenance' | 'audit' | 'hr';
  priority?: 'high' | 'medium' | 'low';
  impact?: 'high' | 'medium' | 'low';
  attendees?: string[];
  assigneeId?: string;
  assignedById?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface CalendarEventsResponse {
  events: CalendarEventData[];
  pagination?: PaginationMeta;
}

export interface CalendarEventResponse {
  event: CalendarEventData;
}

export const useCalendarEvents = (params?: { 
  startDate?: string;
  endDate?: string;
  type?: string;
  page?: number; 
  limit?: number;
}, options?: UseQueryOptions<ApiResponse<CalendarEventsResponse>, Error>) => {
  return useQuery({
    queryKey: ['calendar-events', params],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CalendarEventsResponse>>('/calendar-events', { params });
      return response.data;
    },
    ...options,
  });
};

export const useCalendarEvent = (eventId: string, options?: UseQueryOptions<ApiResponse<CalendarEventResponse>, Error>) => {
  return useQuery({
    queryKey: ['calendar-events', eventId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CalendarEventResponse>>(`/calendar-events/${eventId}`);
      return response.data;
    },
    enabled: !!eventId,
    ...options,
  });
};

export const useCreateCalendarEvent = (options?: UseMutationOptions<ApiResponse<CalendarEventResponse>, Error, any>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (eventData: Omit<CalendarEventData, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post<ApiResponse<CalendarEventResponse>>('/calendar-events', eventData);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: "Success",
        description: "Event created successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useUpdateCalendarEvent = (options?: UseMutationOptions<ApiResponse<CalendarEventResponse>, Error, any>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ 
      eventId, 
      eventData 
    }: { 
      eventId: string; 
      eventData: Partial<Omit<CalendarEventData, 'id' | 'createdAt' | 'updatedAt'>>
    }) => {
      const response = await apiClient.put<ApiResponse<CalendarEventResponse>>(`/calendar-events/${eventId}`, eventData);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events', variables.eventId] });
      toast({
        title: "Success",
        description: "Event updated successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
    ...options,
  });
};

export const useDeleteCalendarEvent = (options?: UseMutationOptions<ApiResponse<null>, Error, string>) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiClient.delete<ApiResponse<null>>(`/calendar-events/${eventId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
    ...options,
  });
};

// ==== Recurring Tasks Hooks ====
export const useRecurringTasks = (params?: { page?: number; limit?: number }, options?: UseQueryOptions<PaginatedApiResponse<RecurringTasksResponse>, Error>) => {
  return useQuery({
    queryKey: ['recurringTasks', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedApiResponse<RecurringTasksResponse>>('/recurring-tasks', { params });
      return response.data;
    },
    ...options,
  });
};

export const useRecurringTask = (taskId: string, options?: UseQueryOptions<ApiResponse<RecurringTaskResponse>, Error>) => {
  return useQuery({
    queryKey: ['recurringTasks', taskId],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<RecurringTaskResponse>>(`/recurring-tasks/${taskId}`);
      return response.data;
    },
    enabled: !!taskId,
    ...options,
  });
};

// ==== Analytics Hooks ====
export const useAnalytics = (params?: { timeframe?: string; teamId?: string }, options?: UseQueryOptions<ApiResponse<AnalyticsResponse>, Error>) => {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiResponse<AnalyticsResponse>>('/analytics', { params });
        return response.data;
      } catch (error) {
        console.error('Analytics API error:', error);
        // Return mock data on error
        return {
          success: true,
          data: {
            data: {
              taskCompletionRate: 0.75,
              tasksCompleted: 12,
              tasksCreated: 16,
              activeUsers: 8,
              timeframeStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              timeframeEnd: new Date().toISOString(),
              tasksPending: 4,
              tasksOverdue: 2,
              userGrowthRate: 0.1,
              newTeamsThisWeek: 1,
              recentActivities: []
            }
          }
        };
      }
    },
    ...options,
  });
};

// ==== Notifications Hooks ====
export const useNotifications = (params?: { page?: number; limit?: number; read?: boolean }, options?: UseQueryOptions<PaginatedApiResponse<NotificationsResponse>, Error>) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: async () => {
      const response = await apiClient.get<PaginatedApiResponse<NotificationsResponse>>('/notifications', { params });
      return response.data;
    },
    ...options,
  });
};

export const useMarkNotificationRead = (options?: UseMutationOptions<ApiResponse<null>, Error, string>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificationId) => {
      const response = await apiClient.patch<ApiResponse<null>>(`/notifications/${notificationId}/read`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications query
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    ...options,
  });
};

export const useMarkAllNotificationsRead = (options?: UseMutationOptions<ApiResponse<null>, Error, void>) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ApiResponse<null>>('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      // Invalidate notifications query
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    ...options,
  });
}; 