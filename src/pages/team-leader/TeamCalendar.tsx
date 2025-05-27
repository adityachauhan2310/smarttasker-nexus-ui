
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Plus, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';

const TeamCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  // Mock task data with calendar events
  const mockCalendarEvents = [
    {
      id: '1',
      title: 'Team standup',
      description: 'Daily team synchronization meeting',
      date: new Date(),
      time: '09:00',
      duration: 30,
      type: 'meeting',
      attendees: ['Alice Johnson', 'Bob Smith', 'Carol Davis'],
      status: 'confirmed'
    },
    {
      id: '2',
      title: 'Code review deadline',
      description: 'Review and merge pending PRs',
      date: new Date(),
      time: '14:00',
      duration: 120,
      type: 'deadline',
      assignee: 'Bob Smith',
      priority: 'high'
    },
    {
      id: '3',
      title: 'Sprint planning',
      description: 'Plan next sprint tasks and goals',
      date: addDays(new Date(), 1),
      time: '10:00',
      duration: 90,
      type: 'meeting',
      attendees: ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson'],
      status: 'confirmed'
    },
    {
      id: '4',
      title: 'Client presentation',
      description: 'Present Q1 project progress to client',
      date: addDays(new Date(), 2),
      time: '11:00',
      duration: 60,
      type: 'meeting',
      attendees: ['Alice Johnson', 'Bob Smith'],
      status: 'tentative'
    },
    {
      id: '5',
      title: 'Design review',
      description: 'Review new UI/UX designs',
      date: addDays(new Date(), 1),
      time: '15:00',
      duration: 45,
      type: 'review',
      attendees: ['Carol Davis', 'David Wilson'],
      status: 'confirmed'
    }
  ];

  const getEventsForDate = (date: Date) => {
    return mockCalendarEvents.filter(event => isSameDay(event.date, date));
  };

  const getEventsForWeek = () => {
    const weekStart = startOfWeek(selectedDate);
    const weekEnd = endOfWeek(selectedDate);
    return mockCalendarEvents.filter(event => 
      event.date >= weekStart && event.date <= weekEnd
    );
  };

  const upcomingDeadlines = [
    { 
      task: 'Website redesign', 
      assignee: 'Alice Johnson', 
      dueDate: '2024-01-20', 
      priority: 'high',
      progress: 75
    },
    { 
      task: 'API documentation', 
      assignee: 'Bob Smith', 
      dueDate: '2024-01-22', 
      priority: 'medium',
      progress: 45
    },
    { 
      task: 'User testing report', 
      assignee: 'Carol Davis', 
      dueDate: '2024-01-25', 
      priority: 'low',
      progress: 20
    },
  ];

  const teamMembers = [
    { name: 'Alice Johnson', status: 'available', avatar: '👩‍💻', statusUntil: '3 PM' },
    { name: 'Bob Smith', status: 'busy', avatar: '👨‍💻', statusUntil: '2 PM' },
    { name: 'Carol Davis', status: 'available', avatar: '👩‍🎨', statusUntil: '5 PM' },
    { name: 'David Wilson', status: 'meeting', avatar: '👨‍💼', statusUntil: '1 PM' },
  ];

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500 border-blue-600';
      case 'deadline': return 'bg-red-500 border-red-600';
      case 'review': return 'bg-purple-500 border-purple-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const renderWeekView = () => {
    const weekEvents = getEventsForWeek();
    const weekDays = Array.from({ length: 7 }, (_, i) => 
      addDays(startOfWeek(selectedDate), i)
    );

    return (
      <div className="grid grid-cols-7 gap-2 h-96">
        {weekDays.map((day, index) => {
          const dayEvents = weekEvents.filter(event => isSameDay(event.date, day));
          return (
            <div key={index} className="border rounded-lg p-2 bg-white dark:bg-gray-800">
              <div className="font-semibold text-sm mb-2 text-center">
                {format(day, 'EEE d')}
              </div>
              <div className="space-y-1">
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded ${getEventTypeColor(event.type)} text-white`}
                  >
                    <div className="font-medium truncate">{event.time}</div>
                    <div className="truncate">{event.title}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate).sort((a, b) => 
      a.time.localeCompare(b.time)
    );

    return (
      <div className="space-y-3">
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No events scheduled for {format(selectedDate, 'MMMM d, yyyy')}
          </div>
        ) : (
          dayEvents.map(event => (
            <div
              key={event.id}
              className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-r"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {event.title}
                </h3>
                <Badge 
                  variant={event.type === 'meeting' ? 'default' : event.type === 'deadline' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {event.type}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {event.description}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {event.time} ({event.duration} min)
                </div>
                {event.attendees && (
                  <div className="flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {event.attendees.length} attendees
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage team schedules, deadlines, and events
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="rounded-r-none"
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-none"
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="rounded-l-none"
            >
              Month
            </Button>
          </div>
          <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Widget */}
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border pointer-events-auto"
            />
          </CardContent>
        </Card>

        {/* Main Calendar View */}
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <span>
                    {viewMode === 'day' && format(selectedDate, 'MMMM d, yyyy')}
                    {viewMode === 'week' && `Week of ${format(startOfWeek(selectedDate), 'MMM d')}`}
                    {viewMode === 'month' && format(selectedDate, 'MMMM yyyy')}
                  </span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? -1 : viewMode === 'week' ? -7 : -30))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {viewMode === 'day' && 'Daily schedule and events'}
                {viewMode === 'week' && 'Weekly team schedule'}
                {viewMode === 'month' && 'Monthly overview'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'month' && (
                <div className="text-center py-8 text-gray-500">
                  Month view coming soon - use Week or Day view for detailed scheduling
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Upcoming Deadlines</span>
            </CardTitle>
            <CardDescription>Tasks due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{deadline.task}</h4>
                    <Badge
                      variant={deadline.priority === 'high' ? 'destructive' : deadline.priority === 'medium' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {deadline.priority}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-500">{deadline.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all" 
                        style={{ width: `${deadline.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <div>Assigned to: {deadline.assignee}</div>
                    <div>Due: {deadline.dueDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Availability */}
      <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Availability</span>
          </CardTitle>
          <CardDescription>Current team member status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {teamMembers.map((member, index) => (
              <div key={index} className="p-4 border rounded-lg text-center hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">{member.avatar}</div>
                <h4 className="font-medium text-sm mb-2">{member.name}</h4>
                <Badge 
                  variant={member.status === 'available' ? 'default' : member.status === 'busy' ? 'destructive' : 'secondary'} 
                  className="text-xs mb-2"
                >
                  {member.status}
                </Badge>
                <p className="text-xs text-gray-500">
                  {member.status === 'available' ? `Free until ${member.statusUntil}` : 
                   member.status === 'busy' ? `Busy until ${member.statusUntil}` :
                   `In meeting until ${member.statusUntil}`}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamCalendar;
