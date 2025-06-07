import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
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
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <Toaster />
                <Sonner />
                <OfflineBanner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/signin" element={<SignIn />} />
                    <Route
                      path="/*"
                      element={
                        <ProtectedRoute>
                          <Layout>
                            <Routes>
                              {/* Admin Routes */}
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
                              
                              {/* Team Leader Routes */}
                              <Route
                                path="/team-leader/dashboard"
                                element={
                                  <ProtectedRoute requiredRole="team_leader">
                                    <TeamLeaderDashboard />
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
                              <Route
                                path="/team-leader/assign-tasks"
                                element={
                                  <ProtectedRoute requiredRole="team_leader">
                                    <TaskAssignment />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/team-leader/team-members"
                                element={
                                  <ProtectedRoute requiredRole="team_leader">
                                    <TeamMemberManagement />
                                  </ProtectedRoute>
                                }
                              />
                              
                              {/* Team Member Routes */}
                              <Route
                                path="/dashboard"
                                element={
                                  <ProtectedRoute>
                                    <TeamMemberDashboard />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/tasks"
                                element={
                                  <ProtectedRoute>
                                    <TaskList />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/tasks/:id"
                                element={
                                  <ProtectedRoute>
                                    <TaskDetail />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/calendar"
                                element={
                                  <ProtectedRoute>
                                    <TeamCalendar />
                                  </ProtectedRoute>
                                }
                              />
                              
                              {/* Shared Routes */}
                              <Route
                                path="/ai-chat"
                                element={
                                  <ProtectedRoute>
                                    <AIChat />
                                  </ProtectedRoute>
                                }
                              />
                              
                              <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            </Routes>
                          </Layout>
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </BrowserRouter>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
