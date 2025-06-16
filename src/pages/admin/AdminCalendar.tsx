import React, { useState, useEffect, useMemo } from 'react';
import CalendarView from '@/components/ui/CalendarView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Building, Shield, Activity, Loader2, AlertCircle, RefreshCw, Calendar, ListTodo } from 'lucide-react';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { useCalendarEvents, useAnalytics, CalendarEventData, useTasksAsEvents } from '@/hooks/useApi';
import AddEventModal from '@/components/modals/AddEventModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EditEventModal from '@/components/modals/EditEventModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import ViewTaskModal from '@/components/modals/ViewTaskModal';
import EditTaskModal from '@/components/modals/EditTaskModal';

const AdminCalendar = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayMode, setDisplayMode] = useState<'all' | 'events' | 'tasks'>('all');
  const [isViewTaskModalOpen, setIsViewTaskModalOpen] = useState(false);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const { user } = useAuth();

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

  // Fetch tasks with due dates for calendar integration
  const {
    events: taskEvents,
    isLoading: isLoadingTasks,
    isError: isErrorTasks,
    refetch: refetchTasks,
    originalTasks
  } = useTasksAsEvents({
    startDate: startDateString,
    endDate: endDateString,
    userId: user?.role === 'admin' ? undefined : user?.id,
  });

  // Fetch analytics for dashboard metrics
  const { 
    data: analyticsData, 
    isLoading: isLoadingAnalytics, 
    isError: isErrorAnalytics 
  } = useAnalytics();

  // Transform API events to CalendarView format
  const events = useMemo(() => {
    const regularEvents = (eventsData?.data?.events || []).map(event => ({
      ...event,
      date: new Date(event.date),
    }));

    // Transform task events to the same format
    const formattedTaskEvents = taskEvents.map(event => ({
      ...event,
      date: new Date(event.date),
    }));

    // Apply display mode filter
    if (displayMode === 'events') {
      return regularEvents;
    } else if (displayMode === 'tasks') {
      return formattedTaskEvents;
    } else {
      // Combine both types of events
      return [...regularEvents, ...formattedTaskEvents];
    }
  }, [eventsData?.data?.events, taskEvents, displayMode]);
  
  // Calculate metrics for calendar cards
  const calendarMetrics = useMemo(() => {
    // Total events (from regular calendar events)
    const totalEvents = eventsData?.data?.events?.length || 0;
    
    // Today's events (from all events including tasks)
    const today = new Date();
    const todayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === today.toDateString();
    }).length;
    
    // Tasks with due dates
    const tasksWithDueDates = originalTasks?.length || 0;
    
    return {
      totalEvents,
      todayEvents,
      tasksWithDueDates
    };
  }, [eventsData?.data?.events, events, originalTasks]);

  // Extract system metrics from analytics data
  const systemMetrics = useMemo(() => {
    if (!analyticsData?.data?.data) {
      return [
        { label: 'Active Users', value: '-', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
        { label: 'Task Completion', value: '-', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Tasks Created', value: '-', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' }
      ];
    }
    
    // Extract metrics from the analytics data
    const analytics = analyticsData.data.data;
    
    // Find metrics by name in the metrics array
    const findMetricValue = (name: string, defaultValue: string = '0') => {
      if (!analytics.metrics) return defaultValue;
      
      const metric = analytics.metrics.find(m => m.name === name);
      return metric ? metric.value.toString() : defaultValue;
    };
    
    // Get completion rate as percentage
    const getCompletionRate = () => {
      if (!analytics.metrics) return '0%';
      
      const metric = analytics.metrics.find(m => m.name === 'systemCompletionRate');
      if (!metric) return '0%';
      
      // If the value is already a percentage string
      if (typeof metric.value === 'string' && metric.value.includes('%')) {
        return metric.value;
      }
      
      // If it's a number between 0-1, convert to percentage
      if (typeof metric.value === 'number' && metric.value <= 1) {
        return `${Math.round(metric.value * 100)}%`;
      }
      
      // Otherwise just return as is with % appended
      return `${metric.value}%`;
    };
    
    return [
      { 
        label: 'Active Users', 
        value: findMetricValue('activeUsers'), 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50 dark:bg-blue-900/20' 
      },
      { 
        label: 'Task Completion', 
        value: getCompletionRate(), 
        color: 'text-green-600', 
        bgColor: 'bg-green-50 dark:bg-green-900/20' 
      },
      { 
        label: 'Tasks Created', 
        value: findMetricValue('totalTasks'), 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-50 dark:bg-purple-900/20' 
      }
    ];
  }, [analyticsData]);

  const handleEventClick = (event: any) => {
    // For task events, fetch the task details and show them in a modal
    if (event.isTask) {
      // Fetch task details and show them in the view modal
      fetch(`/api/tasks/${event.id}`, {
        credentials: 'include'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch task details');
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.data && data.data.task) {
          // Set the selected task and open the view modal
          setSelectedTask(data.data.task);
          setIsViewTaskModalOpen(true);
        } else {
          throw new Error('Invalid task data received');
        }
      })
      .catch(error => {
        console.error('Error fetching task details:', error);
        toast.error('Failed to load task details');
      });
      return;
    }
    
    // For regular events, open the edit modal
    setSelectedEvent(event);
    setIsEditEventModalOpen(true);
  };

  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setIsAddEventModalOpen(true);
  };

  const closeAddEventModal = () => {
    setIsAddEventModalOpen(false);
  };

  const closeEditEventModal = () => {
    setIsEditEventModalOpen(false);
    setSelectedEvent(null);
  };

  const closeViewTaskModal = () => {
    setIsViewTaskModalOpen(false);
    setSelectedTask(null);
  };

  const closeEditTaskModal = () => {
    setIsEditTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleEditTask = () => {
    setIsViewTaskModalOpen(false);
    setIsEditTaskModalOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Just refresh events and tasks since we don't have a refetch method for analytics
      await Promise.all([
        refetchEvents(),
        refetchTasks()
      ]);
      toast.success('Dashboard updated successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
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

      {/* Display Mode Tabs */}
      <Tabs defaultValue="all" value={displayMode} onValueChange={(value) => setDisplayMode(value as 'all' | 'events' | 'tasks')}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoadingEvents || isLoadingTasks ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mr-2" />
          <p>Loading calendar...</p>
        </div>
      ) : isErrorEvents || isErrorTasks ? (
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium">Failed to load {isErrorEvents && isErrorTasks ? 'events and tasks' : isErrorEvents ? 'events' : 'tasks'}</h3>
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
          description="Manage system-wide events, maintenance schedules, and administrative tasks"
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
            {isLoadingEvents || isLoadingTasks ? (
              <div className="flex justify-center items-center py-4">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                <p className="text-sm">Loading calendar data...</p>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-xl hover:shadow-md bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
                      <p className="text-2xl font-bold text-blue-600">{calendarMetrics.totalEvents}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl hover:shadow-md bg-green-50 dark:bg-green-900/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Today's Events</p>
                      <p className="text-2xl font-bold text-green-600">
                        {calendarMetrics.todayEvents}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl hover:shadow-md bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tasks with Due Dates</p>
                      <p className="text-2xl font-bold text-purple-600">{calendarMetrics.tasksWithDueDates}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Monthly Summary Card */}
        <Card className="bg-white dark:bg-gray-800 border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ListTodo className="h-5 w-5 text-blue-600" />
              <span>Upcoming Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTasks ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                <p className="text-sm">Loading tasks...</p>
              </div>
            ) : isErrorTasks ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="mx-auto h-5 w-5 text-red-500 mb-2" />
                <p>Failed to load tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {originalTasks && originalTasks.length > 0 ? (
                  originalTasks.slice(0, 3).map(task => (
                    <div key={task._id} className="flex items-center justify-between p-2 border-b">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <div className="flex items-center space-x-2 text-xs">
                          <Badge variant={task.priority === 'high' || task.priority === 'urgent' ? 'destructive' : 'outline'}>
                            {task.priority}
                          </Badge>
                          <span className="text-gray-500">
                            Due: {new Date(task.dueDate!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div>
                        <Badge variant={task.status === 'completed' ? 'secondary' : task.status === 'in_progress' ? 'default' : 'outline'}>
                          {task.status === 'in_progress' ? 'In Progress' : task.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming tasks with due dates
                  </div>
                )}
                
                {originalTasks && originalTasks.length > 3 && (
                  <Button variant="link" className="w-full" onClick={() => window.location.href = '/admin/tasks'}>
                    View all {originalTasks.length} tasks
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Card */}
        <Card className="bg-white dark:bg-gray-800 border shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>System Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                <p className="text-sm">Loading metrics...</p>
              </div>
            ) : isErrorAnalytics ? (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="mx-auto h-5 w-5 text-red-500 mb-2" />
                <p>Failed to load metrics</p>
              </div>
            ) : (
              <div className="space-y-4">
                {systemMetrics.slice(0, 3).map((metric, index) => (
                  <div key={index} className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{metric.label}</p>
                    <div className="flex items-center justify-between">
                      <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Modals */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={closeAddEventModal}
        initialDate={selectedDate}
      />
      
      {selectedEvent && (
        <EditEventModal
          isOpen={isEditEventModalOpen}
          onClose={closeEditEventModal}
          event={selectedEvent}
        />
      )}

      {selectedTask && (
        <ViewTaskModal
          isOpen={isViewTaskModalOpen}
          onClose={closeViewTaskModal}
          task={selectedTask}
          onEdit={handleEditTask}
        />
      )}

      {selectedTask && (
        <EditTaskModal
          isOpen={isEditTaskModalOpen}
          onClose={closeEditTaskModal}
          task={selectedTask}
        />
      )}
    </div>
  );
};

export default AdminCalendar;
