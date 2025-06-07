// This file is auto-generated. Do not edit manually.

// Model Types
export interface User {
  _id?: string;
  name?: string;
  email?: string;
  role?: 'user' | 'team_lead' | 'admin';
  avatar?: string | null;
  teams?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserProfile {
  _id?: string;
  name?: string;
  email?: string;
  role?: 'user' | 'team_lead' | 'admin';
  avatar?: string | null;
}

export interface Task {
  _id?: string;
  title?: string;
  description?: string | null;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string | null;
  assignedBy?: string | null;
  team?: string | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  tags?: string[];
  attachments?: any[];
  comments?: any[];
  recurringTaskId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Team {
  _id?: string;
  name?: string;
  description?: string | null;
  leader?: string;
  members?: string[];
  avatar?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AnalyticsData {
  _id?: string;
  user?: string | null;
  team?: string | null;
  type?: 'user' | 'team' | 'system';
  category?: 'tasks' | 'performance' | 'productivity' | 'engagement' | 'workload' | 'trends';
  metrics?: any[];
  timeSeries?: any[] | null;
  generatedAt?: Date;
  validUntil?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginatedResponse {
  success?: boolean;
  data?: any[];
  pagination?: Record<string, any>;
}

// API Response Types
// API Request Parameter Types
