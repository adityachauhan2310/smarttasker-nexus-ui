import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, CheckSquare, Clock, TrendingUp, AlertTriangle, Loader2, AlertCircle, RefreshCw, InboxIcon } from 'lucide-react';
import { useUsers, useTasks, useTeams, useAnalytics } from '@/hooks/useApi';
import { format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Fetch data from API
  const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers, refetch: refetchUsers } = useUsers({ limit: 1 });
  const { data: tasksData, isLoading: isLoadingTasks, isError: isErrorTasks, refetch: refetchTasks } = useTasks({ limit: 1 });
  const { data: teamsData, isLoading: isLoadingTeams, isError: isErrorTeams, refetch: refetchTeams } = useTeams({ limit: 1 });
  const { data: analyticsData, isLoading: isLoadingAnalytics, isError: isErrorAnalytics, refetch: refetchAnalytics } = useAnalytics();
  
  // Debug analytics data structure
  useEffect(() => {
    console.log('Analytics Data Structure:', analyticsData);
  }, [analyticsData]);
  
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
        newTeams: 0
      };
    }

    const totalUsers = usersData.pagination?.total || 0;
    const activeTeams = teamsData.pagination?.total || 0;
    const totalTasks = tasksData.pagination?.total || 0;
    
    // Extract task stats from analytics data
    const analyticsDetails = analyticsData.data.data;
    const tasksCompleted = analyticsDetails.tasksCompleted || 0;
    const tasksPending = analyticsDetails.tasksPending || 0; 
    const tasksOverdue = analyticsDetails.tasksOverdue || 0;
    
    // Calculate growth percentages
    const userGrowthRate = analyticsDetails.userGrowthRate || 0;
    const userGrowth = `${(userGrowthRate * 100).toFixed(0)}%`;
    
    const newTeams = analyticsDetails.newTeamsThisWeek || 0;
    
    return {
      totalUsers,
      activeTeams,
      totalTasks,
      completedTasks: tasksCompleted,
      pendingTasks: tasksPending,
      overdueTasks: tasksOverdue,
      userGrowth,
      newTeams
    };
  }, [usersData, teamsData, tasksData, analyticsData]);
  
  // Get recent activities
  const recentActivity = useMemo(() => {
    const defaultActivities = [];
    
    try {
      const analyticsDetails = analyticsData?.data?.data;
      if (!analyticsDetails || !analyticsDetails.recentActivities) {
        return defaultActivities;
      }
      
      return analyticsDetails.recentActivities.map(activity => ({
        user: activity.userName || 'Unknown User',
        action: activity.action || 'performed action',
        task: activity.subject || '',
        time: activity.timeAgo || format(subDays(new Date(), 1), 'h \'hours ago\'')
      })).slice(0, 3);
    } catch (error) {
      console.error('Error processing recent activities:', error);
      return defaultActivities;
    }
  }, [analyticsData]);
  
  const isLoading = isLoadingUsers || isLoadingTasks || isLoadingTeams || isLoadingAnalytics;
  const isError = isErrorUsers || isErrorTasks || isErrorTeams || isErrorAnalytics;
  
  // Check if data is empty - no errors but all stats are zero
  const isEmpty = !isError && !isLoading && (
    !usersData?.pagination?.total && 
    !teamsData?.pagination?.total && 
    !tasksData?.pagination?.total && 
    (!analyticsData?.data?.data || (
      analyticsData.data.data.tasksCompleted === 0 && 
      (analyticsData.data.data.tasksPending === 0 || analyticsData.data.data.tasksPending === undefined) && 
      (analyticsData.data.data.tasksOverdue === 0 || analyticsData.data.data.tasksOverdue === undefined)
    ))
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchUsers(),
        refetchTasks(),
        refetchTeams(),
        refetchAnalytics()
      ]);
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
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Performance */}
        <Card>
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
            <CardDescription>Overall task completion metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.completedTasks}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.pendingTasks}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.overdueTasks}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        <span className="text-blue-600 dark:text-blue-400">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{activity.task}</p>
                    </div>
                    <div className="text-xs text-gray-400">{activity.time}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity to display</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
