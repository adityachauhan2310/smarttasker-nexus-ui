
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { Task, CreateTaskData, UpdateTaskData } from '@/types/task';

// User management hooks
export const useUsers = (params?: { page?: number; limit?: number; search?: string; role?: string }) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*, email:auth.users(email)', { count: 'exact' });

      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%`);
      }

      if (params?.role) {
        query = query.eq('role', params.role);
      }

      const start = ((params?.page || 1) - 1) * (params?.limit || 10);
      const end = start + (params?.limit || 10) - 1;
      
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data?.map(profile => ({
          id: profile.id,
          name: profile.name,
          email: profile.email?.email || '',
          role: profile.role,
          avatar: profile.avatar,
          isActive: profile.is_active,
          teamId: profile.team_id,
          notificationPreferences: profile.notification_preferences,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
        })) || [],
        pagination: {
          total: count || 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          pages: Math.ceil((count || 0) / (params?.limit || 10))
        }
      };
    },
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: { name: string; email: string; password: string; role: string }) => {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          name: userData.name
        }
      });

      if (error) throw error;

      // Update the profile with the role
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: userData.role, name: userData.name })
          .eq('id', data.user.id);

        if (profileError) throw profileError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<User> }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          name: userData.name,
          role: userData.role,
          is_active: userData.isActive,
          team_id: userData.teamId,
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useResetUserPassword = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { data, error } = await supabase.auth.admin.updateUserById(userId, {
        password: password
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return {
        data: {
          user: {
            id: profile.id,
            name: profile.name,
            email: user.email,
            role: profile.role,
            avatar: profile.avatar,
            isActive: profile.is_active,
            teamId: profile.team_id,
            notificationPreferences: profile.notification_preferences,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          }
        }
      };
    },
  });
};

// Teams management hooks
export const useTeams = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: async () => {
      let query = supabase
        .from('teams')
        .select('*, leader:profiles!teams_leader_id_fkey(name)', { count: 'exact' });

      const start = ((params?.page || 1) - 1) * (params?.limit || 10);
      const end = start + (params?.limit || 10) - 1;
      
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        pagination: {
          total: count || 0,
          page: params?.page || 1,
          limit: params?.limit || 10,
          pages: Math.ceil((count || 0) / (params?.limit || 10))
        }
      };
    },
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teamData: { name: string; description?: string; leaderId: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          leader_id: teamData.leaderId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ teamId, teamData }: { teamId: string; teamData: any }) => {
      const { data, error } = await supabase
        .from('teams')
        .update(teamData)
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });
};

// Task management hooks
export const useTasks = (filters?: any) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select('*');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        assignee: task.assigned_to ? {
          id: task.assigned_to,
          name: 'Unknown',
          email: '',
          avatar: '',
        } : null,
        createdBy: {
          id: task.created_by,
          name: 'Unknown',
          email: '',
          avatar: '',
        },
        teamId: task.team_id,
        tags: task.tags || [],
        estimatedTime: task.estimated_time,
        actualTime: task.actual_time,
        completedAt: task.completed_at,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      })) || [];
    },
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskData.title,
          description: taskData.description,
          priority: taskData.priority,
          due_date: taskData.dueDate,
          assigned_to: taskData.assignedTo,
          team_id: taskData.teamId,
          tags: taskData.tags || [],
          estimated_time: taskData.estimatedTime,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, taskData }: { taskId: string; taskData: UpdateTaskData }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Calendar events hooks
export interface CalendarEventData {
  id?: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  duration?: number;
  type: string;
  priority?: string;
  attendees?: string[];
  teamId?: string;
  taskId?: string;
}

export const useCalendarEvents = (filters?: any) => {
  return useQuery({
    queryKey: ['calendar-events', filters],
    queryFn: async () => {
      let query = supabase
        .from('calendar_events')
        .select('*');

      if (filters?.startDate && filters?.endDate) {
        query = query.gte('date', filters.startDate).lte('date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    },
  });
};

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventData: CalendarEventData) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          duration: eventData.duration,
          type: eventData.type,
          priority: eventData.priority,
          attendees: eventData.attendees,
          team_id: eventData.teamId,
          task_id: eventData.taskId,
          assignee_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ eventId, eventData }: { eventId: string; eventData: Partial<CalendarEventData> }) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(eventData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

export const useTasksAsEvents = () => {
  return useQuery({
    queryKey: ['tasks-as-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .not('due_date', 'is', null);

      if (error) throw error;

      return data?.map(task => ({
        id: task.id,
        title: task.title,
        date: task.due_date,
        type: 'task',
        priority: task.priority,
        status: task.status,
      })) || [];
    },
  });
};

// Analytics hook
export const useAnalytics = (params?: { timeframe?: string }) => {
  return useQuery({
    queryKey: ['analytics', params],
    queryFn: async () => {
      // For now, return mock data since we don't have analytics tables yet
      return {
        activeUsers: 0,
        totalUsers: 0,
        tasksCreated: 0,
        tasksCompleted: 0,
        taskCompletionRate: 0,
        teamsCount: 0,
        eventsCount: 0,
        upcomingDeadlines: 0,
      };
    },
  });
};
