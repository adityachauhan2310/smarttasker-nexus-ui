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
        .select('*', { count: 'exact' });

      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
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
          .update({ role: userData.role })
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

// Task management hooks
export const useTasks = (filters?: any) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assigned_to_profile:profiles!tasks_assigned_to_fkey(name, email, avatar),
          created_by_profile:profiles!tasks_created_by_fkey(name, email, avatar)
        `);

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
        assignee: task.assigned_to_profile ? {
          id: task.assigned_to,
          name: task.assigned_to_profile.name,
          email: task.assigned_to_profile.email,
          avatar: task.assigned_to_profile.avatar,
        } : null,
        createdBy: {
          id: task.created_by,
          name: task.created_by_profile.name,
          email: task.created_by_profile.email,
          avatar: task.created_by_profile.avatar,
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

// Analytics hook (placeholder)
export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      // Placeholder analytics data
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
