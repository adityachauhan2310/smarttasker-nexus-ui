import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_leader' | 'team_member';
  avatar?: string;
  isActive?: boolean;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

interface Team {
  id: string;
  name: string;
  description?: string;
  leaderId: string;
  createdAt: string;
  updatedAt: string;
  leader?: User;
  members?: User[];
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedTime?: number;
  actualTime?: number;
  createdBy: string;
  assignedTo?: string;
  teamId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  assignee?: User;
  createdByUser?: User;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'hr' | 'task' | 'meeting' | 'deadline' | 'event' | 'maintenance' | 'audit';
  priority: 'low' | 'medium' | 'high';
  status: 'cancelled' | 'confirmed' | 'tentative';
}

interface CreateTeamData {
  name: string;
  description?: string;
  leaderId: string;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedTime?: number;
  actualTime?: number;
  assignedTo?: string;
  teamId?: string;
  tags?: string[];
}

interface CreateUserData {
  name: string;
  email: string;
  role: 'admin' | 'team_leader' | 'team_member';
  password: string;
}

interface UpdateUserData {
  name?: string;
  email?: string;
  role?: 'admin' | 'team_leader' | 'team_member';
  isActive?: boolean;
  teamId?: string;
}

interface CalendarEventData {
  id?: string;
  title: string;
  date: string;
  type: 'hr' | 'task' | 'meeting' | 'deadline' | 'event' | 'maintenance' | 'audit';
  priority: 'low' | 'medium' | 'high';
  status: 'cancelled' | 'confirmed' | 'tentative';
}

// API Response Wrapper
interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    pages?: number;
  };
}

// Users API
export const useUsers = (params?: { 
  page?: number; 
  limit?: number; 
  search?: string; 
  role?: string;
}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async (): Promise<ApiResponse<User[]>> => {
      let query = supabase
        .from('profiles')
        .select('*');

      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
      }

      if (params?.role) {
        query = query.eq('role', params.role);
      }

      const { data, error } = await query
        .range((params?.page || 0) * (params?.limit || 10), ((params?.page || 0) + 1) * (params?.limit || 10) - 1);

      if (error) throw error;

      const users = data?.map(profile => ({
        id: profile.id,
        name: profile.name,
        email: profile.id + '@example.com',
        role: profile.role as 'admin' | 'team_leader' | 'team_member',
        avatar: profile.avatar,
        isActive: profile.is_active,
        teamId: profile.team_id,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        lastLogin: profile.updated_at,
      })) || [];

      return {
        data: users,
        pagination: {
          page: params?.page || 0,
          limit: params?.limit || 10,
          total: users.length,
          totalPages: Math.ceil(users.length / (params?.limit || 10))
        }
      };
    },
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<ApiResponse<{ user: User }>> => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        throw new Error('Not authenticated');
      }

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
            email: user.email || '',
            role: profile.role as 'admin' | 'team_leader' | 'team_member',
            avatar: profile.avatar,
            isActive: profile.is_active,
            teamId: profile.team_id,
            createdAt: profile.created_at,
            updatedAt: profile.updated_at,
          }
        }
      };
    },
  });
};

// Teams API
export const useTeams = (params?: { 
  page?: number; 
  limit?: number; 
  search?: string;
}) => {
  return useQuery({
    queryKey: ['teams', params],
    queryFn: async (): Promise<Team[]> => {
      let query = supabase
        .from('teams')
        .select(`
          *,
          leader:profiles!leader_id(*)
        `);

      if (params?.search) {
        query = query.ilike('name', `%${params.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data?.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        leaderId: team.leader_id,
        createdAt: team.created_at,
        updatedAt: team.updated_at,
        leader: team.leader ? {
          id: team.leader.id,
          name: team.leader.name,
          email: team.leader.id + '@example.com',
          role: team.leader.role as 'admin' | 'team_leader' | 'team_member',
          avatar: team.leader.avatar,
          isActive: team.leader.is_active,
          teamId: team.leader.team_id,
          createdAt: team.leader.created_at,
          updatedAt: team.leader.updated_at,
        } : undefined,
      })) || [];
    },
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamData: CreateTeamData): Promise<Team> => {
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

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        leaderId: data.leader_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create team:', error);
      toast.error('Failed to create team');
    },
  });
};

// Tasks API
export const useTasks = (params?: { 
  page?: number; 
  limit?: number; 
  search?: string;
  status?: string;
  priority?: string;
}) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async (): Promise<Task[]> => {
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!assigned_to(*),
          createdByUser:profiles!created_by(*)
        `);

      if (params?.search) {
        query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
      }

      if (params?.status) {
        query = query.eq('status', params.status);
      }

      if (params?.priority) {
        query = query.eq('priority', params.priority);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: task.priority as 'low' | 'medium' | 'high',
        dueDate: task.due_date,
        estimatedTime: task.estimated_time,
        actualTime: task.actual_time,
        createdBy: task.created_by,
        assignedTo: task.assigned_to,
        teamId: task.team_id,
        tags: task.tags,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        completedAt: task.completed_at,
        assignee: task.assignee ? {
          id: task.assignee.id,
          name: task.assignee.name,
          email: task.assignee.id + '@example.com',
          role: task.assignee.role as 'admin' | 'team_leader' | 'team_member',
          avatar: task.assignee.avatar,
          isActive: task.assignee.is_active,
          teamId: task.assignee.team_id,
          createdAt: task.assignee.created_at,
          updatedAt: task.assignee.updated_at,
        } : undefined,
        createdByUser: task.createdByUser ? {
          id: task.createdByUser.id,
          name: task.createdByUser.name,
          email: task.createdByUser.id + '@example.com',
          role: task.createdByUser.role as 'admin' | 'team_leader' | 'team_member',
          avatar: task.createdByUser.avatar,
          isActive: task.createdByUser.is_active,
          teamId: task.createdByUser.team_id,
          createdAt: task.createdByUser.created_at,
          updatedAt: task.createdByUser.updated_at,
        } : undefined,
      })) || [];
    },
  });
};

// New hook to transform tasks into calendar events
export const useTasksAsEvents = (params?: {
  startDate?: string;
  endDate?: string;
  userId?: string;
  status?: string;
}) => {
  const { data: tasks, isLoading, isError, refetch } = useTasks();

  return {
    events: tasks?.filter(task => task.dueDate).map(task => ({
      id: task.id,
      title: task.title,
      date: task.dueDate!,
      type: 'task' as const,
      priority: task.priority,
      status: task.status === 'completed' ? 'confirmed' as const : 'tentative' as const,
      isTask: true,
    })) || [],
    isLoading,
    isError,
    refetch,
    originalTasks: tasks,
  };
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, taskData }: { taskId: string; taskData: UpdateTaskData }): Promise<Task> => {
      const updateData: any = {};
      
      if (taskData.title !== undefined) updateData.title = taskData.title;
      if (taskData.description !== undefined) updateData.description = taskData.description;
      if (taskData.status !== undefined) updateData.status = taskData.status;
      if (taskData.priority !== undefined) updateData.priority = taskData.priority;
      if (taskData.dueDate !== undefined) updateData.due_date = taskData.dueDate;
      if (taskData.estimatedTime !== undefined) updateData.estimated_time = taskData.estimatedTime;
      if (taskData.actualTime !== undefined) updateData.actual_time = taskData.actualTime;
      if (taskData.assignedTo !== undefined) updateData.assigned_to = taskData.assignedTo;
      if (taskData.teamId !== undefined) updateData.team_id = taskData.teamId;
      if (taskData.tags !== undefined) updateData.tags = taskData.tags;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: data.priority as 'low' | 'medium' | 'high',
        dueDate: data.due_date,
        estimatedTime: data.estimated_time,
        actualTime: data.actual_time,
        createdBy: data.created_by,
        assignedTo: data.assigned_to,
        teamId: data.team_id,
        tags: data.tags,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        completedAt: data.completed_at,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update task:', error);
      toast.error('Failed to update task');
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    },
  });
};

// Calendar Events API
export const useCalendarEvents = (params?: {
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['calendarEvents', params],
    queryFn: async (): Promise<ApiResponse<{ events: CalendarEvent[] }>> => {
      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('date', { ascending: true });

      if (params?.startDate) {
        query = query.gte('date', params.startDate);
      }

      if (params?.endDate) {
        query = query.lte('date', params.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const events = data?.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        type: event.type as 'hr' | 'task' | 'meeting' | 'deadline' | 'event' | 'maintenance' | 'audit',
        priority: event.priority as 'low' | 'medium' | 'high',
        status: event.status as 'cancelled' | 'confirmed' | 'tentative',
      })) || [];

      return {
        data: { events }
      };
    },
  });
};

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: CalendarEventData): Promise<CalendarEvent> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(eventData)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        date: data.date,
        type: data.type as 'hr' | 'task' | 'meeting' | 'deadline' | 'event' | 'maintenance' | 'audit',
        priority: data.priority as 'low' | 'medium' | 'high',
        status: data.status as 'cancelled' | 'confirmed' | 'tentative',
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success('Event created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create event:', error);
      toast.error('Failed to create event');
    },
  });
};

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, eventData }: { eventId: string; eventData: CalendarEventData }): Promise<CalendarEvent> => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(eventData)
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        title: data.title,
        date: data.date,
        type: data.type as 'hr' | 'task' | 'meeting' | 'deadline' | 'event' | 'maintenance' | 'audit',
        priority: data.priority as 'low' | 'medium' | 'high',
        status: data.status as 'cancelled' | 'confirmed' | 'tentative',
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success('Event updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update event:', error);
      toast.error('Failed to update event');
    },
  });
};

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string): Promise<void> => {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success('Event deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event');
    },
  });
};

// Users Management API
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: CreateUserData): Promise<User> => {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
          }
        }
      });

      if (error) throw error;

      return {
        id: data.user?.id || '',
        name: userData.name,
        email: userData.email,
        role: userData.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      console.error('Failed to create user:', error);
      toast.error('Failed to create user');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: UpdateUserData }): Promise<User> => {
      const updateData: any = {};
      
      if (userData.name !== undefined) updateData.name = userData.name;
      if (userData.role !== undefined) updateData.role = userData.role;
      if (userData.isActive !== undefined) updateData.is_active = userData.isActive;
      if (userData.teamId !== undefined) updateData.team_id = userData.teamId;

      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        email: data.id + '@example.com',
        role: data.role as 'admin' | 'team_leader' | 'team_member',
        avatar: data.avatar,
        isActive: data.is_active,
        teamId: data.team_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      console.error('Failed to update user:', error);
      toast.error('Failed to update user');
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    },
  });
};

export const useResetUserPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, password }: { userId: string | null; password: string }): Promise<void> => {
      if (!userId) throw new Error('User ID is required');
      
      console.log(`Resetting password for user ${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Password reset successfully');
    },
    onError: (error: any) => {
      console.error('Failed to reset password:', error);
      toast.error('Failed to reset password');
    },
  });
};

// Analytics API
export const useAnalytics = () => {
  return useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: tasksCreated } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      const { count: tasksCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      const { count: teamsCount } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true });

      const { count: eventsCount } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true });

      const taskCompletionRate = tasksCreated ? (tasksCompleted || 0) / tasksCreated * 100 : 0;

      return {
        activeUsers: activeUsers || 0,
        totalUsers: totalUsers || 0,
        tasksCreated: tasksCreated || 0,
        tasksCompleted: tasksCompleted || 0,
        taskCompletionRate,
        teamsCount: teamsCount || 0,
        eventsCount: eventsCount || 0,
        upcomingDeadlines: 0,
      };
    },
  });
};

// Export types
export type { User, Team, Task, CalendarEvent, CalendarEventData, CreateTeamData, UpdateTaskData, CreateUserData, UpdateUserData };
