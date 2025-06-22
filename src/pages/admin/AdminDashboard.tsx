
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  Activity,
  Target,
  BarChart3
} from 'lucide-react';
import { useUsers, useTeams, useTasks, useAnalytics } from '@/hooks/useApi';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('week');
  
  const { data: users = [] } = useUsers();
  const { data: teams = [] } = useTeams();
  const { data: tasks = [] } = useTasks();
  const { data: analytics } = useAnalytics();

  // Calculate metrics from the data
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;
  const totalTeams = teams.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Priority distribution
  const priorityStats = tasks.reduce((acc, task) => {
    acc[task.priority] = (acc[task.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const highPriorityTasks = priorityStats.high || 0;
  const mediumPriorityTasks = priorityStats.medium || 0;
  const lowPriorityTasks = priorityStats.low || 0;

  // Recent tasks (last 5)
  const recentTasks = tasks.slice(0, 5);

  const handleCreateUser = () => {
    navigate('/admin/users');
  };

  const handleViewTasks = () => {
    navigate('/admin/tasks');
  };

  const handleViewTeams = () => {
    navigate('/admin/teams');
  };

  const handleViewCalendar = () => {
    navigate('/admin/calendar');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your SmartTasker AI workspace</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button onClick={handleViewCalendar} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{totalUsers}</div>
            <p className="text-xs text-blue-600 mt-1">
              {activeUsers} active users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{completedTasks}</div>
            <p className="text-xs text-green-600 mt-1">
              {completionRate.toFixed(1)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{pendingTasks}</div>
            <p className="text-xs text-orange-600 mt-1">
              {inProgressTasks} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Active Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{totalTeams}</div>
            <p className="text-xs text-purple-600 mt-1">
              Teams created
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Priority Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Task Priority Distribution
            </CardTitle>
            <CardDescription>
              Current workload by priority level
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium">High Priority</span>
                </div>
                <span className="text-sm text-gray-600">{highPriorityTasks} tasks</span>
              </div>
              <Progress 
                value={totalTasks > 0 ? (highPriorityTasks / totalTasks) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium">Medium Priority</span>
                </div>
                <span className="text-sm text-gray-600">{mediumPriorityTasks} tasks</span>
              </div>
              <Progress 
                value={totalTasks > 0 ? (mediumPriorityTasks / totalTasks) * 100 : 0} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium">Low Priority</span>
                </div>
                <span className="text-sm text-gray-600">{lowPriorityTasks} tasks</span>
              </div>
              <Progress 
                value={totalTasks > 0 ? (lowPriorityTasks / totalTasks) * 100 : 0} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleCreateUser}
              className="w-full justify-start" 
              variant="outline"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create New User
            </Button>
            <Button 
              onClick={handleViewTeams}
              className="w-full justify-start" 
              variant="outline"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Teams
            </Button>
            <Button 
              onClick={handleViewTasks}
              className="w-full justify-start" 
              variant="outline"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              View All Tasks
            </Button>
            <Button 
              onClick={handleViewCalendar}
              className="w-full justify-start" 
              variant="outline"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Recent Tasks
          </CardTitle>
          <CardDescription>
            Latest task activity in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentTasks.length > 0 ? (
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600">
                        Created by {task.createdByUser?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant="outline">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent tasks found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
