
import React, { useState } from 'react';
import CalendarView from '@/components/ui/CalendarView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Building, Shield, Activity } from 'lucide-react';
import { addDays } from 'date-fns';

const AdminCalendar = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const systemEvents = [
    {
      id: '1',
      title: 'System Maintenance',
      description: 'Scheduled database optimization',
      date: addDays(new Date(), 1),
      time: '02:00',
      duration: 120,
      type: 'maintenance' as const,
      impact: 'high' as const,
      assignedBy: 'System Admin'
    },
    {
      id: '2',
      title: 'Security Audit',
      description: 'Quarterly security assessment',
      date: addDays(new Date(), 3),
      time: '09:00',
      duration: 480,
      type: 'audit' as const,
      impact: 'medium' as const,
      assignedBy: 'Security Team'
    },
    {
      id: '3',
      title: 'Performance Review Cycle',
      description: 'Q1 team performance evaluations',
      date: addDays(new Date(), 7),
      time: '10:00',
      duration: 300,
      type: 'hr' as const,
      impact: 'low' as const,
      assignedBy: 'HR Department'
    },
    {
      id: '4',
      title: 'Admin Strategy Meeting',
      description: 'Quarterly strategic planning session',
      date: new Date(),
      time: '14:00',
      duration: 90,
      type: 'meeting' as const,
      impact: 'high' as const,
      assignedBy: 'Admin'
    }
  ];

  const teamStats = [
    { team: 'Development', members: 8, activeProjects: 5, completionRate: 87, trend: 'up' },
    { team: 'Design', members: 4, activeProjects: 3, completionRate: 92, trend: 'up' },
    { team: 'Marketing', members: 6, activeProjects: 4, completionRate: 78, trend: 'down' },
    { team: 'Sales', members: 5, activeProjects: 6, completionRate: 95, trend: 'up' }
  ];

  const systemMetrics = [
    { label: 'Active Users', value: '1,247', trend: '+12%', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'System Uptime', value: '99.8%', trend: '+0.2%', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Active Projects', value: '34', trend: '+8%', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'Storage Used', value: '78%', trend: '+5%', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' }
  ];

  const handleEventClick = (event: any) => {
    console.log('Admin event clicked:', event);
  };

  const handleAddEvent = (date: Date) => {
    console.log('Add admin event for date:', date);
  };

  return (
    <div className="space-y-6 animate-ultra-fade-in">
      <CalendarView
        events={systemEvents}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onEventClick={handleEventClick}
        onAddEvent={handleAddEvent}
        title="Admin Calendar"
        description="Manage system events, maintenance schedules, and administrative tasks"
        role="admin"
      />

      {/* Admin Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Metrics */}
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl transition-all duration-300 hover:shadow-2xl animate-ultra-slide-up delay-400">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>System Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemMetrics.map((metric, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-xl transition-all duration-300 hover:shadow-md animate-ultra-scale-in ${metric.bgColor}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
                    <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {metric.trend}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Team Performance Overview */}
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl transition-all duration-300 hover:shadow-2xl animate-ultra-slide-up delay-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-green-600" />
                <span>Team Performance Overview</span>
              </CardTitle>
              <CardDescription>Real-time team statistics and project completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamStats.map((team, index) => (
                  <div 
                    key={index} 
                    className="p-6 border rounded-xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 animate-ultra-scale-in"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-lg text-gray-900 dark:text-white">{team.team}</h4>
                      <TrendingUp className={`h-5 w-5 ${team.trend === 'up' ? 'text-green-500' : 'text-red-500'} animate-pulse`} />
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Members:</span>
                          <div className="font-bold text-xl">{team.members}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Projects:</span>
                          <div className="font-bold text-xl">{team.activeProjects}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Completion Rate:</span>
                          <span className="font-bold">{team.completionRate}%</span>
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
      </div>
    </div>
  );
};

export default AdminCalendar;
