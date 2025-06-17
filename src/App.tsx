import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/layout/Layout';

// Pages
import Index from '@/pages/Index';
import SignIn from '@/pages/SignIn';
import NotFound from '@/pages/NotFound';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import UserManagement from '@/pages/admin/UserManagement';
import TeamManagement from '@/pages/admin/TeamManagement';
import AdminTasks from '@/pages/admin/AdminTasks';
import AdminCalendar from '@/pages/admin/AdminCalendar';
import AdminSettings from '@/pages/admin/AdminSettings';

// Team Leader Pages
import TeamLeaderDashboard from '@/pages/team-leader/TeamLeaderDashboard';
import TaskAssignment from '@/pages/team-leader/TaskAssignment';
import TeamMemberManagement from '@/pages/team-leader/TeamMemberManagement';
import TeamCalendar from '@/pages/team-leader/TeamCalendar';

// Team Member Pages
import TeamMemberDashboard from '@/pages/team-member/TeamMemberDashboard';
import TaskList from '@/pages/team-member/TaskList';
import TaskDetail from '@/pages/team-member/TaskDetail';
import TeamMemberCalendar from '@/pages/team-member/TeamMemberCalendar';

// Other Pages
import AIChat from '@/pages/AIChat';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/signin" element={<SignIn />} />
              
              {/* Protected routes with layout */}
              <Route element={<Layout />}>
                {/* Admin routes */}
                <Route 
                  path="/admin/dashboard" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/users" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/teams" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <TeamManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/tasks" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminTasks />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/calendar" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminCalendar />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/settings" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminSettings />
                    </ProtectedRoute>
                  } 
                />

                {/* Team Leader routes */}
                <Route 
                  path="/team-leader/dashboard" 
                  element={
                    <ProtectedRoute requiredRole="team_leader">
                      <TeamLeaderDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/team-leader/task-assignment" 
                  element={
                    <ProtectedRoute requiredRole="team_leader">
                      <TaskAssignment />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/team-leader/team-management" 
                  element={
                    <ProtectedRoute requiredRole="team_leader">
                      <TeamMemberManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/team-leader/calendar" 
                  element={
                    <ProtectedRoute requiredRole="team_leader">
                      <TeamCalendar />
                    </ProtectedRoute>
                  } 
                />

                {/* Team Member routes */}
                <Route 
                  path="/team-member/dashboard" 
                  element={
                    <ProtectedRoute requiredRole="team_member">
                      <TeamMemberDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/team-member/tasks" 
                  element={
                    <ProtectedRoute requiredRole="team_member">
                      <TaskList />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/team-member/tasks/:id" 
                  element={
                    <ProtectedRoute requiredRole="team_member">
                      <TaskDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/team-member/calendar" 
                  element={
                    <ProtectedRoute requiredRole="team_member">
                      <TeamMemberCalendar />
                    </ProtectedRoute>
                  } 
                />

                {/* Shared routes */}
                <Route 
                  path="/chat" 
                  element={
                    <ProtectedRoute>
                      <AIChat />
                    </ProtectedRoute>
                  } 
                />

                {/* Default dashboard redirects based on role */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Navigate to="/admin/dashboard" replace />
                    </ProtectedRoute>
                  } 
                />
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
