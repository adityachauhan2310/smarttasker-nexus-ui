
// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  token?: string;
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: PaginationMeta;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  totalPages?: number; // For backward compatibility
}

// Auth Types
export interface LoginResponse {
  user: {
    id: string; // Changed from _id to id
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  token: string;
}

// User Types
export interface UserResponse {
  user: {
    id: string; // Changed from _id to id
    name: string;
    email: string;
    role: string;
    avatar?: string;
    isActive?: boolean;
    teamId?: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export interface UsersResponse {
  users: Array<{
    id: string; // Changed from _id to id
    name: string;
    email: string;
    role: string;
    avatar?: string;
    isActive?: boolean;
    teamId?: string;
    createdAt?: string;
    updatedAt?: string;
  }>;
}

// Task Types
export interface TaskResponse {
  task: {
    id: string; // Changed from _id to id
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate?: string;
    assignee?: {
      id: string; // Changed from _id to id
      name: string;
      email: string;
      avatar?: string;
    } | null;
    createdBy: {
      id: string; // Changed from _id to id
      name: string;
      email: string;
      avatar?: string;
    };
    teamId?: string;
    tags: string[];
    estimatedTime?: number;
    actualTime?: number;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface TasksResponse {
  tasks: Array<{
    id: string; // Changed from _id to id
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate?: string;
    assignee?: {
      id: string; // Changed from _id to id
      name: string;
      email: string;
      avatar?: string;
    } | null;
    createdBy: {
      id: string; // Changed from _id to id
      name: string;
      email: string;
      avatar?: string;
    };
    teamId?: string;
    tags: string[];
    estimatedTime?: number;
    actualTime?: number;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Team Types
export interface TeamResponse {
  team: {
    id: string; // Changed from _id to id
    name: string;
    description?: string;
    leader: {
      id: string; // Changed from _id to id
      name: string;
      email: string;
      avatar?: string;
    };
    members: Array<{
      id: string; // Changed from _id to id
      name: string;
      email: string;
      avatar?: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}

export interface TeamsResponse {
  teams: Array<{
    id: string; // Changed from _id to id
    name: string;
    description?: string;
    leader: {
      id: string; // Changed from _id to id
      name: string;
      email: string;
      avatar?: string;
    };
    memberCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Recurring Task Types
export interface RecurringTaskResponse {
  recurringTask: {
    id: string; // Changed from _id to id
    title: string;
    description?: string;
    frequency: string;
    intervalValue: number;
    startDate: string;
    endDate?: string;
    createdBy: {
      id: string; // Changed from _id to id
      name: string;
      email: string;
    };
    teamId?: string;
    taskTemplate: Record<string, any>;
    tasksGenerated: number;
    paused: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface RecurringTasksResponse {
  recurringTasks: Array<{
    id: string; // Changed from _id to id
    title: string;
    description?: string;
    frequency: string;
    intervalValue: number;
    startDate: string;
    endDate?: string;
    createdBy: {
      id: string; // Changed from _id to id
      name: string;
      email: string;
    };
    teamId?: string;
    tasksGenerated: number;
    paused: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Analytics Types
export interface AnalyticsResponse {
  activeUsers: number;
  totalUsers: number;
  tasksCreated: number;
  tasksCompleted: number;
  taskCompletionRate: number;
  teamsCount: number;
  eventsCount: number;
  upcomingDeadlines: number;
  metrics?: Array<{
    name: string;
    value: number | string;
    unit?: string;
    metadata?: any;
  }>;
  timeSeries?: Array<{
    name: string;
    points: Array<{ x: string; y: number }>;
    interval: string;
  }>;
}

// Notification Types
export interface NotificationsResponse {
  notifications: Array<{
    id: string; // Changed from _id to id
    type: string;
    title: string;
    message: string;
    priority: string;
    read: boolean;
    readAt?: string;
    referenceType?: string;
    referenceId?: string;
    data?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  }>;
}
