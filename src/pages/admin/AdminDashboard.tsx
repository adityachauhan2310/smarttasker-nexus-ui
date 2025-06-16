import React, { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, Users, CheckSquare, Clock, TrendingUp, 
  AlertTriangle, Loader2, AlertCircle, RefreshCw, 
  InboxIcon, CheckCircle, Clock3, Timer 
} from 'lucide-react';
import { useUsers, useTasks, useTeams, useAnalytics } from '@/hooks/useApi';
import { format, subDays, parseISO, formatDistance } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const AdminDashboard = () => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch data from API with no limits to get accurate counts
  const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers, refetch: refetchUsers } = useUsers({});
  const { data: tasksData, isLoading: isLoadingTasks, isError: isErrorTasks, refetch: refetchTasks } = useTasks({});
  const { data: teamsData, isLoading: isLoadingTeams, isError: isErrorTeams, refetch: refetchTeams } = useTeams({});
  const { data: analyticsData, isLoading: isLoadingAnalytics, isError: isErrorAnalytics, refetch: refetchAnalytics } = useAnalytics({ timeframe: 'month' });
  
  // Extract stats from API responses
  const stats = useMemo(() => {
    // Check for missing data
    if (!usersData || !teamsData || !tasksData || !analyticsData?.data?.data) {
      return {
        totalUsers: 0,
        activeTeams: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        overdueTasks: 0,
        userGrowth: '0%',
        newTeams: 0,
        taskBreakdown: {}
      };
    }

    const totalUsers = usersData.pagination?.total || 0;
    const activeTeams = teamsData.pagination?.total || 0;
    const totalTasks = tasksData.pagination?.total || 0;
    
    // Extract task stats from analytics data
    const analyticsDetails = analyticsData.data.data;
    
    // Function to find metrics by name
    const findMetricValue = (name: string, defaultValue: number = 0) => {
      if (!analyticsDetails.metrics) return defaultValue;
      const metric = analyticsDetails.metrics.find(m => m.name === name);
      return metric ? Number(metric.value) : defaultValue;
    };
    
    const tasksCompleted = findMetricValue('tasksCompleted', 0);
    const tasksPending = findMetricValue('tasksPending', 0); 
    const tasksOverdue = findMetricValue('tasksOverdue', 0);
    
    // Calculate growth percentages
    const userGrowthRate = findMetricValue('userGrowthRate', 0);
    const userGrowth = `${(userGrowthRate * 100).toFixed(0)}%`;
    
    const newTeams = findMetricValue('newTeamsThisWeek', 0);

    // Extract task breakdown by priority if available
    const taskBreakdown = {
      high: findMetricValue('tasksByPriority.high', 0),
      medium: findMetricValue('tasksByPriority.medium', 0),
      low: findMetricValue('tasksByPriority.low', 0)
    };
    
    return {
      totalUsers,
      activeTeams,
      totalTasks,
      completedTasks: tasksCompleted,
      pendingTasks: tasksPending,
      overdueTasks: tasksOverdue,
      userGrowth,
      newTeams,
      taskBreakdown
    };
  }, [usersData, teamsData, tasksData, analyticsData]);
  
  // Extract recent activities from data
  const recentActivity = useMemo(() => {
    const defaultActivities = [];
    
    try {
      // First check if we have real activity data in analytics
      const analyticsDetails = analyticsData?.data?.data;
      if (analyticsDetails?.metrics) {
        const activitiesMetric = analyticsDetails.metrics.find(m => m.name === 'recentActivities');
        if (activitiesMetric?.metadata && Array.isArray(activitiesMetric.metadata)) {
          return activitiesMetric.metadata.map(activity => ({
            user: activity.userName || 'Unknown User',
            action: activity.action || 'performed action',
            task: activity.subject || '',
            time: activity.timeAgo || format(subDays(new Date(), 1), 'h \'hours ago\''),
            timestamp: activity.timestamp || new Date().toISOString()
          })).slice(0, 5);
        }
      }
      
      // If no analytics data, generate from recent tasks if available
      if (tasksData?.data && Array.isArray(tasksData.data)) {
        const recentTasks = [...tasksData.data]
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5);
        
        return recentTasks.map(task => ({
          user: task.assignedTo?.name || 'Unassigned',
          action: task.status === 'completed' ? 'completed' : 'updated',
          task: task.title,
          time: formatDistance(parseISO(task.updatedAt), new Date(), { addSuffix: true }),
          timestamp: task.updatedAt
        }));
      }
      
      return defaultActivities;
    } catch (error) {
      console.error('Error processing recent activities:', error);
      return defaultActivities;
    }
  }, [analyticsData, tasksData]);
  
  const isLoading = isLoadingUsers || isLoadingTasks || isLoadingTeams || isLoadingAnalytics;
  const isError = isErrorUsers || isErrorTasks || isErrorTeams || isErrorAnalytics;
  
  // Check if data is empty - no errors but all stats are zero
  const isEmpty = !isError && !isLoading && (
    !usersData?.pagination?.total && 
    !teamsData?.pagination?.total && 
    !tasksData?.pagination?.total && 
    (!analyticsData?.data?.data || !analyticsData?.data?.data?.metrics || analyticsData?.data?.data?.metrics.length === 0)
  );

  // Calculate task completion rate for progress bars
  const taskCompletionRate = useMemo(() => {
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  }, [stats.completedTasks, stats.totalTasks]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Refresh each data source separately to avoid type issues
      await refetchUsers();
      await refetchTasks();
      await refetchTeams();
      
      // Only attempt to refresh analytics if it's a function
      if (typeof refetchAnalytics === 'function') {
        await refetchAnalytics();
      }
      
      toast.success('Dashboard data refreshed');
    } catch (error) {
      toast.error('Failed to refresh some data');
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <InboxIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Dashboard Data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There is no data available to display at this time.
          </p>
          <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Failed to load dashboard data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            There was a problem fetching the dashboard information.
          </p>
          <Button onClick={handleRefresh} variant="outline" disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>
      <p className="text-gray-600 dark:text-gray-400">
        System overview and management tools
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-blue-100">{stats.userGrowth} from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teams</CardTitle>
            <BarChart3 className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTeams}</div>
            <p className="text-xs text-green-100">+{stats.newTeams} new teams this week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-purple-100">Across all teams</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overdueTasks}</div>
            <p className="text-xs text-orange-100">Needs attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Performance */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <CardTitle>System Performance</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Real-time
                  </Badge>
                </div>
                <CardDescription>Overall task completion metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">Completed Tasks</p>
                        <p className="text-sm text-muted-foreground">{stats.completedTasks} tasks</p>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span className="font-medium">{taskCompletionRate}%</span>
                      </div>
                    </div>
                    <Progress value={taskCompletionRate} className="h-2 mt-2" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="font-bold text-xl text-green-700 dark:text-green-400">
                        {stats.completedTasks}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-500">Completed</div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <div className="font-bold text-xl text-yellow-700 dark:text-yellow-400">
                        {stats.pendingTasks}
                      </div>
                      <div className="text-xs text-yellow-600 dark:text-yellow-500">Pending</div>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="font-bold text-xl text-red-700 dark:text-red-400">
                        {stats.overdueTasks}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-500">Overdue</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-indigo-600" />
                    <CardTitle>Recent Activity</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    Latest
                  </Badge>
                </div>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 p-2 rounded-full">
                          <Clock3 className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            <span className="font-semibold">{activity.user}</span>
                            {' '}{activity.action}{' '}
                            {activity.task && <span className="font-medium">"{activity.task}"</span>}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No recent activity to display</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <CardTitle>Task Management</CardTitle>
              </div>
              <CardDescription>Detailed task statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Task by priority chart */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Tasks by Priority</h3>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span className="text-sm">High Priority</span>
                        </div>
                        <span className="text-sm font-medium">{stats.taskBreakdown.high || 0}</span>
                      </div>
                      <Progress value={(stats.taskBreakdown.high || 0) / stats.totalTasks * 100} className="h-2 mt-1 bg-gray-100 dark:bg-gray-800" indicatorClassName="bg-red-500" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                          <span className="text-sm">Medium Priority</span>
                        </div>
                        <span className="text-sm font-medium">{stats.taskBreakdown.medium || 0}</span>
                      </div>
                      <Progress value={(stats.taskBreakdown.medium || 0) / stats.totalTasks * 100} className="h-2 mt-1 bg-gray-100 dark:bg-gray-800" indicatorClassName="bg-yellow-500" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm">Low Priority</span>
                        </div>
                        <span className="text-sm font-medium">{stats.taskBreakdown.low || 0}</span>
                      </div>
                      <Progress value={(stats.taskBreakdown.low || 0) / stats.totalTasks * 100} className="h-2 mt-1 bg-gray-100 dark:bg-gray-800" indicatorClassName="bg-green-500" />
                    </div>
                  </div>
                </div>

                {/* Task Status Summary */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Task Status Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="border border-gray-200 dark:border-gray-800">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-indigo-100 rounded-full mr-3 dark:bg-indigo-900/30">
                            <Timer className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Completion Rate</p>
                            <p className="text-xs text-muted-foreground">Task efficiency</p>
                          </div>
                        </div>
                        <div className="text-xl font-bold">{taskCompletionRate}%</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-gray-200 dark:border-gray-800">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 bg-orange-100 rounded-full mr-3 dark:bg-orange-900/30">
                            <Clock className="h-5 w-5 text-orange-700 dark:text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">Overdue Rate</p>
                            <p className="text-xs text-muted-foreground">Tasks behind schedule</p>
                          </div>
                        </div>
                        <div className="text-xl font-bold">
                          {stats.totalTasks > 0 
                            ? Math.round((stats.overdueTasks / stats.totalTasks) * 100) 
                            : 0}%
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardTitle>Activity Log</CardTitle>
              </div>
              <CardDescription>Detailed system activity history</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Task/Subject</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{activity.user}</TableCell>
                        <TableCell>{activity.action}</TableCell>
                        <TableCell>{activity.task || '-'}</TableCell>
                        <TableCell>{activity.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <InboxIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">No activity records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
