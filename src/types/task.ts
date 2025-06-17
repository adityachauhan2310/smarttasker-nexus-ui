
export interface Task {
  id: string; // Changed from _id to id for Supabase
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignee?: {
    id: string; // Changed from _id to id
    name: string;
    email: string;
    avatar?: string;
  } | null;
  assigneeName?: string;
  createdBy: {
    id: string; // Changed from _id to id
    name: string;
    email: string;
    avatar?: string;
  };
  createdByName?: string;
  teamId?: string;
  tags: string[];
  estimatedTime?: number;
  actualTime?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assignee?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignedTo?: string;
  teamId?: string;
  tags?: string[];
  estimatedTime?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  assignedTo?: string;
  teamId?: string;
  tags?: string[];
  estimatedTime?: number;
  actualTime?: number;
}
