import React, { useState, useEffect } from 'react';
import CalendarView from '@/components/ui/CalendarView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Building, Shield, Activity, Loader2, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { useCalendarEvents, useAnalytics } from '@/hooks/useApi';
import AddEventModal from '@/components/modals/AddEventModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const AdminCalendar = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get current month's start and end dates for fetching events
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const startDateString = format(monthStart, 'yyyy-MM-dd');
  const endDateString = format(monthEnd, 'yyyy-MM-dd');

  // Fetch calendar events
  const { 
    data: eventsData, 
    isLoading: isLoadingEvents, 
    isError: isErrorEvents,
    refetch: refetchEvents
  } = useCalendarEvents({
    startDate: startDateString,
    endDate: endDateString,
  });

  // Fetch analytics for dashboard metrics
  const { 
    data: analyticsData, 
    isLoading: isLoadingAnalytics, 
    isError: isErrorAnalytics 
  } = useAnalytics();

  // Transform API events to CalendarView format
  const events = React.useMemo(() => {
    if (!eventsData?.data?.events) return [];
    return eventsData.data.events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      date: new Date(event.date),
      time: event.time,
      duration: event.duration,
      type: event.type,
      impact: event.impact,
      assignedBy: event.assignedById || 'System',
      priority: event.priority,
      status: event.status,
    }));
  }, [eventsData]);

  // Extract system metrics from analytics data
  const systemMetrics = React.useMemo(() => {
    if (!analyticsData?.data?.data) {
      return [
        { label: 'Active Users', value: '-', trend: '0%', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'System Uptime', value: '-', trend: '0%', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Active Projects', value: '-', trend: '0%', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
        { label: 'Storage Used', value: '-', trend: '0%', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' }
      ];
    }
    
    const analytics = analyticsData.data.data;
    return [
      { 
        label: 'Active Users', 
        value: analytics.activeUsers?.toString() || '0', 
        trend: '+0%', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50 dark:bg-blue-900/20' 
      },
      { 
        label: 'Task Completion', 
        value: analytics.taskCompletionRate ? `${Math.round(analytics.taskCompletionRate * 100)}%` : '0%', 
        trend: '+0%', 
        color: 'text-green-600', 
        bgColor: 'bg-green-50 dark:bg-green-900/20' 
      },
      { 
        label: 'Tasks Created', 
        value: analytics.tasksCreated?.toString() || '0', 
        trend: '+0%', 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-50 dark:bg-purple-900/20' 
      },
      { 
        label: 'Tasks Completed', 
        value: analytics.tasksCompleted?.toString() || '0', 
        trend: '+0%', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-50 dark:bg-orange-900/20' 
      }
    ];
  }, [analyticsData]);

  const handleEventClick = (event: any) => {
    console.log('Admin event clicked:', event);
    // Here you could open an edit event modal
  };

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setIsAddEventModalOpen(true);
  };

  const closeAddEventModal = () => {
    setIsAddEventModalOpen(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchEvents();
      toast.success('Calendar events refreshed');
    } catch (error) {
      toast.error('Failed to refresh calendar events');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing || isLoadingEvents}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoadingEvents ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-2" />
          <p>Loading calendar...</p>
        </div>
      ) : isErrorEvents ? (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium">Failed to load events</h3>
          <p className="text-gray-500 mb-4">Please try again later</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      ) : (
        <CalendarView
          events={events}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onEventClick={handleEventClick}
          onAddEvent={handleAddEvent}
          title="Admin Calendar"
          description="Manage system events, maintenance schedules, and administrative tasks"
          role="admin"
        />
      )}

      {/* Admin Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Metrics - replaced with Key Calendar Info */}
        <Card className="bg-white dark:bg-gray-800 border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span>Key Calendar Info</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl hover:shadow-md bg-blue-50 dark:bg-blue-900/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                  <p className="text-2xl font-bold text-blue-600">{events.length || 0}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl hover:shadow-md bg-green-50 dark:bg-green-900/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Events</p>
                  <p className="text-2xl font-bold text-green-600">
                    {events.filter(event => {
                      const today = new Date();
                      const eventDate = new Date(event.date);
                      return eventDate.toDateString() === today.toDateString();
                    }).length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl hover:shadow-md bg-purple-50 dark:bg-purple-900/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming Week</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {events.filter(event => {
                      const today = new Date();
                      const nextWeek = new Date();
                      nextWeek.setDate(today.getDate() + 7);
                      const eventDate = new Date(event.date);
                      return eventDate > today && eventDate <= nextWeek;
                    }).length || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl hover:shadow-md bg-orange-50 dark:bg-orange-900/20">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {events.filter(event => event.priority === 'high').length || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Performance Overview - replaced with a placeholder since we're focusing on calendar functionality */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-800 border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-green-600" />
                <span>Team Performance Overview</span>
              </CardTitle>
              <CardDescription>Real-time team statistics and project completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Team performance data will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={closeAddEventModal}
        initialDate={selectedDate}
      />
    </div>
  );
};

export default AdminCalendar;
