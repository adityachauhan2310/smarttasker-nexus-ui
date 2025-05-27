
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        // Simulate API call to verify token
        const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Simulate login API call
      const mockUsers = [
        {
          id: '1',
          email: 'admin@smarttasker.ai',
          name: 'Admin User',
          role: 'admin' as const,
          avatar: '/api/placeholder/40/40',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
        {
          id: '2',
          email: 'teamlead@smarttasker.ai',
          name: 'Team Leader',
          role: 'team_leader' as const,
          avatar: '/api/placeholder/40/40',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
        {
          id: '3',
          email: 'member@smarttasker.ai',
          name: 'Team Member',
          role: 'team_member' as const,
          avatar: '/api/placeholder/40/40',
          isActive: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        },
      ];

      const user = mockUsers.find(u => u.email === email && password === 'password123');
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const token = 'mock_jwt_token_' + user.id;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
      setUser(user);
      
      return user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    setUser(null);
  };

  const hasPermission = (requiredRole?: string) => {
    if (!user || !requiredRole) return true;
    
    const roleHierarchy = {
      admin: 3,
      team_leader: 2,
      team_member: 1,
    };
    
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy];
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy];
    
    return userLevel >= requiredLevel;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
