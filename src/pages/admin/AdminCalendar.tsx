
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
  BarChart3,
  TrendingUp,
  Building,
  ChevronLeft,
  ChevronRight,
  Filter,
  Settings
} from 'lucide-react';
import { format, addDays, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

const AdminCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const systemEvents = [
    {
      id: '1',
      title: 'System Maintenance',
      description: 'Scheduled database optimization',
      date: addDays(new Date(), 1),
      time: '02:00',
      duration: 120,
      type: 'maintenance',
      impact: 'high',
      assignedBy: 'System Admin'
    },
    {
      id: '2',
      title: 'Security Audit',
      description: 'Quarterly security assessment',
      date: addDays(new Date(), 3),
      time: '09:00',
      duration: 480,
      type: 'audit',
      impact: 'medium',
      assignedBy: 'Security Team'
    },
    {
      id: '3',
      title: 'Performance Review Cycle',
      description: 'Q1 team performance evaluations',
      date: addDays(new Date(), 7),
      time: '10:00',
      duration: 300,
      type: 'hr',
      impact: 'low',
      assignedBy: 'HR Department'
    },
    {
      id: '4',
      title: 'Admin Strategy Meeting',
      description: 'Quarterly strategic planning session',
      date: new Date(),
      time: '14:00',
      duration: 90,
      type: 'meeting',
      impact: 'high',
      assignedBy: 'Admin'
    }
  ];

  const teamStats = [
    { team: 'Development', members: 8, activeProjects: 5, completionRate: 87, trend: 'up' },
    { team: 'Design', members: 4, activeProjects: 3, completionRate: 92, trend: 'up' },
    { team: 'Marketing', members: 6, activeProjects: 4, completionRate: 78, trend: 'down' },
    { team: 'Sales', members: 5, activeProjects: 6, completionRate: 95, trend: 'up' }
  ];

  const getEventsForDate = (date: Date) => {
    return systemEvents.filter(event => isSameDay(event.date, date));
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-red-500/20 border-red-500/40 text-red-300';
      case 'audit': return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300';
      case 'hr': return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
      case 'meeting': return 'bg-purple-500/20 border-purple-500/40 text-purple-300';
      default: return 'bg-gray-500/20 border-gray-500/40 text-gray-300';
    }
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(selectedDate).sort((a, b) => 
      a.time.localeCompare(b.time)
    );

    return (
      <div className="space-y-4">
        {dayEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 animate-ultra-fade-in">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No events scheduled for {format(selectedDate, 'MMMM d, yyyy')}</p>
            <Button className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        ) : (
          dayEvents.map((event, index) => (
            <div
              key={event.id}
              className={`border-l-4 border-purple-500 pl-6 py-4 bg-white/5 dark:bg-gray-800/50 rounded-r-xl ultra-hover animate-ultra-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {event.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={event.type === 'maintenance' ? 'destructive' : event.type === 'audit' ? 'secondary' : 'default'}
                    className="text-xs"
                  >
                    {event.type}
                  </Badge>
                  <Badge 
                    variant={event.impact === 'high' ? 'destructive' : event.impact === 'medium' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {event.impact} impact
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {event.description}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {event.time} ({event.duration} min)
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {event.assignedBy}
                  </div>
                </div>
                <Button size="sm" variant="outline" className="ultra-hover">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-ultra-fade-in page-transition">
      <div className="flex items-center justify-between">
        <div className="animate-ultra-slide-up">
          <h1 className="text-4xl font-bold gradient-text">Admin Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Manage system events, maintenance schedules, and administrative tasks
          </p>
        </div>
        <div className="flex items-center space-x-3 animate-ultra-slide-up delay-200">
          <div className="flex items-center border rounded-lg backdrop-blur-sm bg-white/10">
            <Button
              variant={viewMode === 'day' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('day')}
              className="rounded-r-none ultra-hover"
            >
              Day
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('week')}
              className="rounded-none ultra-hover"
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('month')}
              className="rounded-l-none ultra-hover"
            >
              Month
            </Button>
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 ultra-hover">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Enhanced Calendar Widget */}
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl ultra-hover calendar-enhanced animate-ultra-slide-up delay-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
              <span>Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border pointer-events-auto calendar-enhanced"
            />
            <div className="mt-6 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-sm">Maintenance</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500 animate-pulse delay-200"></div>
                <span className="text-sm">Audits</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-blue-500 animate-pulse delay-400"></div>
                <span className="text-sm">HR Events</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-purple-500 animate-pulse delay-600"></div>
                <span className="text-sm">Admin Tasks</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced System Events */}
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl ultra-hover animate-ultra-slide-up delay-400">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>
                      {viewMode === 'day' && format(selectedDate, 'MMMM d, yyyy')}
                      {viewMode === 'week' && `Week of ${format(startOfWeek(selectedDate), 'MMM d')}`}
                      {viewMode === 'month' && format(selectedDate, 'MMMM yyyy')}
                    </span>
                  </CardTitle>
                  <CardDescription>Administrative events and system tasks</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? -1 : viewMode === 'week' ? -7 : -30))}
                    className="ultra-hover"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                    className="ultra-hover"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30))}
                    className="ultra-hover"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'day' && renderDayView()}
              {viewMode !== 'day' && (
                <div className="space-y-4">
                  {systemEvents.map((event, index) => (
                    <div 
                      key={event.id} 
                      className={`border-l-4 border-purple-500 pl-6 py-4 rounded-r-xl ultra-hover animate-ultra-slide-up ${getEventTypeColor(event.type)}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">
                          {event.title}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={event.type === 'maintenance' ? 'destructive' : event.type === 'audit' ? 'secondary' : 'default'}
                            className="text-xs"
                          >
                            {event.type}
                          </Badge>
                          <Badge 
                            variant={event.impact === 'high' ? 'destructive' : event.impact === 'medium' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {event.impact} impact
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm mb-2">
                        {event.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs">
                        <div className="flex items-center">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {format(event.date, 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {event.time} ({event.duration} min)
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Quick Stats */}
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl ultra-hover animate-ultra-slide-up delay-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>System Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl ultra-hover">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">47</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl ultra-hover">
              <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">23</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Active Projects</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl ultra-hover">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">99.2%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">System Uptime</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Team Performance Overview */}
      <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl ultra-hover animate-ultra-slide-up delay-600">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5 text-green-600" />
            <span>Team Performance Overview</span>
          </CardTitle>
          <CardDescription>Real-time team statistics and project completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamStats.map((team, index) => (
              <div 
                key={index} 
                className="p-6 border rounded-xl hover:shadow-lg transition-all duration-300 ultra-hover bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 animate-ultra-scale-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{team.team}</h4>
                  <TrendingUp className={`h-4 w-4 ${team.trend === 'up' ? 'text-green-500' : 'text-red-500'} animate-pulse`} />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Members:</span>
                    <span className="font-medium">{team.members}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Projects:</span>
                    <span className="font-medium">{team.activeProjects}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Completion:</span>
                      <span className="font-medium">{team.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000 animate-shimmer" 
                        style={{ width: `${team.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCalendar;
