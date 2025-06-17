
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'team_leader' | 'team_member';
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/signin',
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading authentication...</span>
      </div>
    );
  }

  // If not authenticated, redirect to login page
  if (!isAuthenticated || !user) {
    console.log("User not authenticated, redirecting to", redirectTo);
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based permissions
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    console.log(`User doesn't have required role: ${requiredRole}, redirecting to /unauthorized`);
    return <Navigate to="/unauthorized" replace />;
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;
