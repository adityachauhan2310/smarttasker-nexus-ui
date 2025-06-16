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
  const [refreshAttempts, setRefreshAttempts] = useState<number>(0);
  
  // Initialize React Query client
  const queryClient = useQueryClient();
  
  // React Query hooks with minimal configuration
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const { refetch: fetchUser, isError: userFetchError } = useCurrentUser({ 
    queryKey: ['currentUser'],
    enabled: false,
    retry: 3,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Check auth status on mount and whenever refreshAttempts changes
  useEffect(() => {
    const checkAuthStatus = async () => {
      setLoading(true);
      // We rely on the apiClient to have restored the token from storage
      // on initialization.
      const hasToken = apiClient.restoreAuthToken();

      if (hasToken) {
        try {
          // fetch user, but don't cause a logout if it fails initially.
          // The interceptor will handle token refresh on 401s for subsequent requests.
          const response = await fetchUser();
          if (response.data?.data?.user) {
            setUser(response.data.data.user);
          } else {
            // If we got a response but no user, try to refresh the token
            const refreshed = await apiClient.refreshToken();
            if (refreshed && refreshAttempts < 3) {
              setRefreshAttempts(prev => prev + 1);
            }
          }
        } catch (error) {
          console.error("Failed to fetch user on initial load:", error);
          // Try to refresh the token if fetch fails
          const refreshed = await apiClient.refreshToken();
          if (refreshed && refreshAttempts < 3) {
            setRefreshAttempts(prev => prev + 1);
          }
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, [fetchUser, refreshAttempts]);
  
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
    apiClient.clearAuthToken(); // Ensure token is cleared
    // Clear React Query cache on logout
    queryClient.clear();
  }, [logoutMutation, queryClient]);
  
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
