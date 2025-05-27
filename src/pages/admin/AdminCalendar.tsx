
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
  Building
} from 'lucide-react';
import { format, addDays, isSameDay } from 'date-fns';

const AdminCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const systemEvents = [
    {
      id: '1',
      title: 'System Maintenance',
      description: 'Scheduled database optimization',
      date: addDays(new Date(), 1),
      time: '02:00',
      duration: 120,
      type: 'maintenance',
      impact: 'high'
    },
    {
      id: '2',
      title: 'Security Audit',
      description: 'Quarterly security assessment',
      date: addDays(new Date(), 3),
      time: '09:00',
      duration: 480,
      type: 'audit',
      impact: 'medium'
    },
    {
      id: '3',
      title: 'Performance Review Cycle',
      description: 'Q1 team performance evaluations',
      date: addDays(new Date(), 7),
      time: '10:00',
      duration: 300,
      type: 'hr',
      impact: 'low'
    }
  ];

  const teamStats = [
    { team: 'Development', members: 8, activeProjects: 5, completionRate: 87 },
    { team: 'Design', members: 4, activeProjects: 3, completionRate: 92 },
    { team: 'Marketing', members: 6, activeProjects: 4, completionRate: 78 },
    { team: 'Sales', members: 5, activeProjects: 6, completionRate: 95 }
  ];

  const getEventsForDate = (date: Date) => {
    return systemEvents.filter(event => isSameDay(event.date, date));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage system events, maintenance schedules, and team overviews
          </p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Event
        </Button>
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
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-xs">Maintenance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-xs">Audits</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs">HR Events</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Events */}
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
            <CardHeader>
              <CardTitle>Upcoming System Events</CardTitle>
              <CardDescription>Scheduled maintenance and important dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemEvents.map(event => (
                  <div key={event.id} className="border-l-4 border-purple-500 pl-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-r">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {event.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
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
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Quick Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">47</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Active Users</div>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">23</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Active Projects</div>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">89%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">System Uptime</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Overview */}
      <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Team Performance Overview</span>
          </CardTitle>
          <CardDescription>Real-time team statistics and project completion rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamStats.map((team, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{team.team}</h4>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Members:</span>
                    <span className="font-medium">{team.members}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Projects:</span>
                    <span className="font-medium">{team.activeProjects}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Completion:</span>
                      <span className="font-medium">{team.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all" 
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
