import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import OfflineBanner from "./components/OfflineBanner";
import SignIn from "./pages/SignIn";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import TeamManagement from "./pages/admin/TeamManagement";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminCalendar from "./pages/admin/AdminCalendar";
import TeamLeaderDashboard from "./pages/team-leader/TeamLeaderDashboard";
import TeamCalendar from "./pages/team-leader/TeamCalendar";
import TaskAssignment from "./pages/team-leader/TaskAssignment";
import TeamMemberManagement from "./pages/team-leader/TeamMemberManagement";
import TeamMemberDashboard from "./pages/team-member/TeamMemberDashboard";
import TaskList from "./pages/team-member/TaskList";
import TaskDetail from "./pages/team-member/TaskDetail";
import AIChat from "./pages/AIChat";
import Layout from "./components/layout/Layout";

// Create QueryClient instance outside of component to prevent re-creation
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// Component to listen for authentication events
const AuthListener = () => {
  const { logout } = useAuth();

  useEffect(() => {
    const handleAuthRequired = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Auth required event received:', customEvent.detail);
      logout();
    };

    window.addEventListener('auth:required', handleAuthRequired);
    
    return () => {
      window.removeEventListener('auth:required', handleAuthRequired);
    };
  }, [logout]);

  return null; // This component doesn't render anything
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <AuthProvider>
              <AuthListener />
              <NotificationProvider>
                <Toaster />
                <Sonner />
                <OfflineBanner />
                <Routes>
                  <Route path="/signin" element={<SignIn />} />
                  
                  {/* Admin Routes */}
                  <Route
                    path="/admin/dashboard"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Layout><AdminDashboard /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Layout><UserManagement /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/teams"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Layout><TeamManagement /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/tasks"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Layout><AdminTasks /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/calendar"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Layout><AdminCalendar /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <Layout><AdminSettings /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Team Leader Routes */}
                  <Route
                    path="/team-leader/dashboard"
                    element={
                      <ProtectedRoute requiredRole="team_leader">
                        <Layout><TeamLeaderDashboard /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/team-leader/calendar"
                    element={
                      <ProtectedRoute requiredRole="team_leader">
                        <Layout><TeamCalendar /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/team-leader/assign-tasks"
                    element={
                      <ProtectedRoute requiredRole="team_leader">
                        <Layout><TaskAssignment /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/team-leader/team-members"
                    element={
                      <ProtectedRoute requiredRole="team_leader">
                        <Layout><TeamMemberManagement /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Team Member Routes */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Layout><TeamMemberDashboard /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tasks"
                    element={
                      <ProtectedRoute>
                        <Layout><TaskList /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tasks/:id"
                    element={
                      <ProtectedRoute>
                        <Layout><TaskDetail /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/calendar"
                    element={
                      <ProtectedRoute>
                        <Layout><TeamCalendar /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  
                  {/* Shared Routes */}
                  <Route
                    path="/ai-chat"
                    element={
                      <ProtectedRoute>
                        <Layout><AIChat /></Layout>
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
