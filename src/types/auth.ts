
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'team_leader' | 'team_member';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  teamId?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  loading: boolean;
  hasPermission: (requiredRole?: string) => boolean;
}
