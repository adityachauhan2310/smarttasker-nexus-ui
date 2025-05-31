
import React, { useState } from 'react';
import CalendarView from '@/components/ui/CalendarView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Target, TrendingUp } from 'lucide-react';
import { addDays } from 'date-fns';

const TeamMemberCalendar = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const myEvents = [
    {
      id: '1',
      title: 'Daily Standup',
      description: 'Team sync meeting',
      date: new Date(),
      time: '09:00',
      duration: 15,
      type: 'meeting' as const,
      status: 'confirmed' as const
    },
    {
      id: '2',
      title: 'Feature Development',
      description: 'Work on user authentication module',
      date: new Date(),
      time: '10:00',
      duration: 240,
      type: 'task' as const,
      priority: 'high' as const
    },
    {
      id: '3',
      title: 'Code Review',
      description: 'Review pull requests from team',
      date: addDays(new Date(), 1),
      time: '14:00',
      duration: 60,
      type: 'task' as const,
      priority: 'medium' as const
    },
    {
      id: '4',
      title: 'Project Deadline',
      description: 'Submit final deliverables',
      date: addDays(new Date(), 3),
      time: '17:00',
      duration: 0,
      type: 'deadline' as const,
      priority: 'high' as const
    }
  ];

  const myTasks = [
    { id: 1, title: 'Complete user authentication', progress: 75, priority: 'high', dueDate: '2024-01-18' },
    { id: 2, title: 'Write unit tests', progress: 45, priority: 'medium', dueDate: '2024-01-20' },
    { id: 3, title: 'Update documentation', progress: 20, priority: 'low', dueDate: '2024-01-25' },
    { id: 4, title: 'Fix bug reports', progress: 90, priority: 'high', dueDate: '2024-01-16' }
  ];

  const productivityStats = [
    { label: 'Tasks Completed', value: '12', period: 'This Week', color: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Hours Logged', value: '32', period: 'This Week', color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Avg. Task Time', value: '2.5h', period: 'Per Task', color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: 'On-time Delivery', value: '95%', period: 'This Month', color: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' }
  ];

  const handleEventClick = (event: any) => {
    console.log('My event clicked:', event);
  };

  const handleAddEvent = (date: Date) => {
    console.log('Add personal event for date:', date);
  };

  return (
    <div className="space-y-6 animate-ultra-fade-in">
      <CalendarView
        events={myEvents}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onEventClick={handleEventClick}
        onAddEvent={handleAddEvent}
        title="My Calendar"
        description="Manage your personal schedule and tasks"
        role="team_member"
      />

      {/* Personal Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Tasks */}
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl transition-all duration-300 hover:shadow-2xl animate-ultra-slide-up delay-400">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>My Tasks</span>
            </CardTitle>
            <CardDescription>Current assigned tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myTasks.map((task, index) => (
                <div 
                  key={task.id} 
                  className="p-4 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:shadow-md animate-ultra-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-sm">{task.title}</h4>
                    <Badge
                      variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-500 font-medium">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    Due: <span className="font-medium">{task.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Productivity Stats */}
        <div className="lg:col-span-2">
          <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl transition-all duration-300 hover:shadow-2xl animate-ultra-slide-up delay-500">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span>Productivity Overview</span>
              </CardTitle>
              <CardDescription>Your performance metrics and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {productivityStats.map((stat, index) => (
                  <div 
                    key={index} 
                    className={`p-6 rounded-xl transition-all duration-300 hover:shadow-md animate-ultra-scale-in ${stat.bgColor}`}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-2 ${stat.color}`}>{stat.value}</div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{stat.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{stat.period}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Recent Achievements */}
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl">
                <h4 className="font-semibold text-sm mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Recent Achievements
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Completed 5 tasks ahead of schedule this week
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Zero missed deadlines this month
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    Received positive feedback on code quality
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamMemberCalendar;
