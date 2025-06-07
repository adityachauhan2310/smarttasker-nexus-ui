import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, AuthContextType } from '../types/auth';
import apiClient from '../client/api/apiClient';
import { useLogin, useCurrentUser, useLogout } from '../hooks/useApi';
import { ApiResponse, LoginResponse, UserResponse } from '../types/api';

// Create a default value for AuthContext to avoid providing undefined
const defaultContextValue: AuthContextType = {
  user: null,
  loading: true,
  login: async () => { throw new Error('Not implemented'); },
  logout: () => {},
  hasPermission: () => false,
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  console.log("Rendering AuthProvider");
  
  // State
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Initialize React Query client
  const queryClient = useQueryClient();
  
  // React Query hooks with minimal configuration
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const { refetch: fetchUser } = useCurrentUser({ 
    queryKey: ['currentUser'],
    enabled: false 
  });
  
  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let hasToken = apiClient.restoreAuthToken();
        // If no token, try to refresh using the refresh token cookie
        if (!hasToken) {
          const newToken = await apiClient.refreshToken();
          if (newToken) {
            apiClient.setAuthToken(newToken);
            hasToken = true;
          }
        }
        if (!hasToken) {
          setLoading(false);
          return;
        }
        try {
          const response = await fetchUser();
          if (response.data?.data?.user) {
            setUser(response.data.data.user);
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          apiClient.clearAuthToken();
        } finally {
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setLoading(false);
      }
    };
    checkAuth();
  }, []); // Only run on mount
  
  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginMutation.mutateAsync({ email, password });
      
      if (result?.data?.user) {
        setUser(result.data.user);
        return result.data.user;
      }
      
      throw new Error("Invalid response from server");
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  }, [loginMutation]);
  
  // Logout function
  const logout = useCallback(() => {
    logoutMutation.mutate();
    setUser(null);
  }, [logoutMutation]);
  
  // Permission check
  const hasPermission = useCallback((requiredRole?: string) => {
    if (!user || !requiredRole) return false;
    
    const roleHierarchy: Record<string, number> = {
      admin: 3,
      team_leader: 2,
      team_member: 1,
    };
    
    const userLevel = roleHierarchy[user.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;
    
    return userLevel >= requiredLevel;
  }, [user]);
  
  // Create context value object with useMemo to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    hasPermission
  }), [user, loading, login, logout, hasPermission]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
