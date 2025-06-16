import React, { useState, useMemo } from 'react';
import CalendarView from '@/components/ui/CalendarView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Target, TrendingUp, AlertCircle, Loader2, RefreshCw, Calendar, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { useCalendarEvents, useTasksAsEvents } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddEventModal from '@/components/modals/AddEventModal';
import EditEventModal from '@/components/modals/EditEventModal';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import ViewTaskModal from '@/components/modals/ViewTaskModal';
import EditTaskModal from '@/components/modals/EditTaskModal';

const TeamMemberCalendar = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [displayMode, setDisplayMode] = useState<'all' | 'events' | 'tasks'>('all');
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // Fetch tasks with due dates - include tasks assigned to this user
  const {
    events: taskEvents,
    isLoading: isLoadingTasks,
    isError: isErrorTasks,
    refetch: refetchTasks,
    originalTasks
  } = useTasksAsEvents({
    startDate: startDateString,
    endDate: endDateString,
    userId: user?._id,
    status: 'pending,in_progress,completed'
  });

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

  const handleEventClick = (event: any) => {
    // For task events, open the task view modal
    if (event.isTask) {
      try {
        // Find the original task data
        const task = originalTasks?.find(t => t.id === event.id || t._id === event.id);
        if (task) {
          setSelectedTask(task);
          setIsViewTaskModalOpen(true);
        } else {
          console.error('Task not found in originalTasks:', event.id);
          toast.error('Could not find task details');
        }
      } catch (error) {
        console.error('Error handling task click:', error);
        toast.error('Error opening task details');
      }
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

  const handleAddTask = (date: Date) => {
    setSelectedDate(date);
    setIsAddTaskModalOpen(true);
  };

  const closeAddEventModal = () => {
    setIsAddEventModalOpen(false);
  };

  const closeAddTaskModal = () => {
    setIsAddTaskModalOpen(false);
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
      await Promise.all([
        refetchEvents(),
        refetchTasks()
      ]);
      toast.success('Calendar updated successfully');
    } catch (error) {
      toast.error('Failed to refresh calendar');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTaskCreated = () => {
    refetchTasks();
  };

  // Filter and sort upcoming tasks
  const upcomingTasks = useMemo(() => {
    if (!originalTasks) return [];
    
    return [...originalTasks]
      .filter(task => task.dueDate)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate!);
        const dateB = new Date(b.dueDate!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 4); // Take only the first 4 tasks
  }, [originalTasks]);

  // Calculate productivity stats based on actual task data
  const productivityStats = useMemo(() => {
    const completedTasks = originalTasks?.filter(task => task.status === 'completed').length || 0;
    const totalTasks = originalTasks?.length || 0;
    const tasksWithDueDates = originalTasks?.filter(task => task.dueDate).length || 0;
    const highPriorityTasks = originalTasks?.filter(task => task.priority === 'high' || task.priority === 'urgent').length || 0;
    
    return [
      { 
        label: 'Tasks Completed', 
        value: completedTasks.toString(), 
        period: 'This month', 
        color: 'text-green-600', 
        bgColor: 'bg-green-50 dark:bg-green-900/20' 
      },
      { 
        label: 'Total Tasks', 
        value: totalTasks.toString(), 
        period: 'Active', 
        color: 'text-blue-600', 
        bgColor: 'bg-blue-50 dark:bg-blue-900/20' 
      },
      { 
        label: 'Scheduled Tasks', 
        value: tasksWithDueDates.toString(), 
        period: 'With due date', 
        color: 'text-purple-600', 
        bgColor: 'bg-purple-50 dark:bg-purple-900/20' 
      },
      { 
        label: 'High Priority', 
        value: highPriorityTasks.toString(), 
        period: 'Tasks', 
        color: 'text-orange-600', 
        bgColor: 'bg-orange-50 dark:bg-orange-900/20' 
      }
    ];
  }, [originalTasks]);

  return (
    <div className="space-y-6 animate-ultra-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Calendar</h1>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing || isLoadingEvents || isLoadingTasks}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => setIsAddTaskModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
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
          <h3 className="text-lg font-medium">Failed to load calendar data</h3>
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
          title="My Calendar"
          description="Manage your personal schedule and tasks"
          role="team_member"
        />
      )}

      {/* Personal Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl transition-all duration-300 hover:shadow-2xl animate-ultra-slide-up delay-400">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Upcoming Tasks</span>
            </CardTitle>
            <CardDescription>Tasks with approaching deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-4">
                {upcomingTasks.map((task, index) => (
                  <div 
                    key={task._id || task.id} 
                    className="p-4 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:shadow-md animate-ultra-scale-in cursor-pointer"
                    style={{ animationDelay: `${index * 100}ms` }}
                    onClick={() => {
                      setSelectedTask(task);
                      setIsViewTaskModalOpen(true);
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-sm">{task.title}</h4>
                      <Badge
                        variant={task.priority === 'high' || task.priority === 'urgent' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                    {task.status && (
                      <div className="flex items-center text-xs">
                        <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500">No upcoming tasks</p>
                <Button 
                  onClick={() => setIsAddTaskModalOpen(true)}
                  className="mt-4"
                  variant="outline"
                  size="sm"
                >
                  Create a task
                </Button>
              </div>
            )}

            {/* Calendar Summary Section */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl">
              <h4 className="font-semibold text-sm mb-3 flex items-center">
                <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                Calendar Summary
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {(eventsData?.data?.events || []).length}
                  </div>
                  <div className="text-xs text-gray-500">Events</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {(originalTasks || []).length}
                  </div>
                  <div className="text-xs text-gray-500">Tasks on Calendar</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {events.filter(e => {
                      const today = new Date();
                      const eventDate = new Date(e.date);
                      return eventDate.toDateString() === today.toDateString();
                    }).length}
                  </div>
                  <div className="text-xs text-gray-500">Today's Items</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Productivity */}
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl transition-all duration-300 hover:shadow-2xl animate-ultra-slide-up delay-600 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>My Task Overview</span>
            </CardTitle>
            <CardDescription>Your task performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {productivityStats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`${stat.bgColor} p-4 rounded-xl animate-ultra-scale-in transition-all`}
                  style={{ animationDelay: `${index * 100 + 200}ms` }}
                >
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs mt-1 text-gray-500">
                    {stat.label}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {stat.period}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Modals */}
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

      <CreateTaskModal
        isOpen={isAddTaskModalOpen}
        onClose={closeAddTaskModal}
        onTaskCreated={handleTaskCreated}
        userRole="team_member"
        userId={user?._id}
        initialDueDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
      />

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

export default TeamMemberCalendar;
