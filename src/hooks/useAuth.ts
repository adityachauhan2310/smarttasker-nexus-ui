import { useCurrentUser } from './useApi';
import { useCallback } from 'react';
import { User } from '@/types/auth';

export function useAuth() {
  const { data, isLoading, error, refetch } = useCurrentUser();

  const user = data?.data?.user || null;
  
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isTeamLeader = user?.role === 'team_leader';
  const isTeamMember = user?.role === 'team_member';
  
  const checkAccess = useCallback((requiredRoles: string[]) => {
    if (!user) return false;
    return requiredRoles.includes(user.role);
  }, [user]);

  return {
    user,
    isLoading,
    error,
    isAuthenticated,
    isAdmin,
    isTeamLeader,
    isTeamMember,
    checkAccess,
    refetch
  };
}

export default useAuth; 