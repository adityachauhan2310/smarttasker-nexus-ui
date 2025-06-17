
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team_leader' | 'team_member';
  avatar?: string;
  isActive?: boolean;
  teamId?: string;
  notificationPreferences?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}
