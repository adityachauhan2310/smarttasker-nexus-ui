import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';

const TeamMemberDashboard = () => {
  // Use useMemo to ensure these objects are not recreated on every render
  const stats = useMemo(() => ({
    totalTasks: 24,
    completedTasks: 18,
    inProgressTasks: 4,
    overdueTasks: 2,
  }), []);

  const completionRate = useMemo(() => 
    (stats.completedTasks / stats.totalTasks) * 100
  , [stats.completedTasks, stats.totalTasks]);

  const recentTasks = useMemo(() => [
    {
      id: '1',
      title: 'Update user authentication flow',
      status: 'completed',
      priority: 'high',
      dueDate: '2024-01-15',
      completedAt: '2024-01-14',
    },
    {
      id: '2',
      title: 'Design dashboard mockups',
      status: 'in_progress',
      priority: 'medium',
      dueDate: '2024-01-18',
    },
    {
      id: '3',
      title: 'Write API documentation',
      status: 'in_progress',
      priority: 'low',
      dueDate: '2024-01-20',
    },
  ], []);

  const upcomingDeadlines = useMemo(() => [
    { task: 'Design dashboard mockups', dueDate: '2024-01-18', priority: 'medium' },
    { task: 'Write API documentation', dueDate: '2024-01-20', priority: 'low' },
    { task: 'Review pull requests', dueDate: '2024-01-22', priority: 'high' },
  ], []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back! Here's an overview of your tasks and progress.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Target className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-blue-100">All assigned tasks</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-xs text-green-100">Tasks finished</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
            <p className="text-xs text-yellow-100">Currently working</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(0)}%</div>
            <p className="text-xs text-purple-100">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>Your task completion progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Progress</span>
                <span>{completionRate.toFixed(0)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.completedTasks}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.inProgressTasks}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Your latest task activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant={task.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {task.status === 'completed' ? task.completedAt : task.dueDate}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Upcoming Deadlines</span>
          </CardTitle>
          <CardDescription>Tasks due soon</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingDeadlines.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.task}</h4>
                  <p className="text-xs text-gray-500 mt-1">Due: {item.dueDate}</p>
                </div>
                <Badge 
                  variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {item.priority}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamMemberDashboard;
