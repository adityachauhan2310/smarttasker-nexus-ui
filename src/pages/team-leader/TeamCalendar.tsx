
import React, { useState } from 'react';
import CalendarView from '@/components/ui/CalendarView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Clock, TrendingUp, Target } from 'lucide-react';
import { addDays } from 'date-fns';

const TeamCalendar = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  // Mock calendar events for team leader
  const mockCalendarEvents = [
    {
      id: '1',
      title: 'Team standup',
      description: 'Daily team synchronization meeting',
      date: new Date(),
      time: '09:00',
      duration: 30,
      type: 'meeting' as const,
      attendees: ['Alice Johnson', 'Bob Smith', 'Carol Davis'],
      status: 'confirmed' as const
    },
    {
      id: '2',
      title: 'Code review deadline',
      description: 'Review and merge pending PRs',
      date: new Date(),
      time: '14:00',
      duration: 120,
      type: 'deadline' as const,
      assignee: 'Bob Smith',
      priority: 'high' as const
    },
    {
      id: '3',
      title: 'Sprint planning',
      description: 'Plan next sprint tasks and goals',
      date: addDays(new Date(), 1),
      time: '10:00',
      duration: 90,
      type: 'meeting' as const,
      attendees: ['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson'],
      status: 'confirmed' as const
    },
    {
      id: '4',
      title: 'Client presentation',
      description: 'Present Q1 project progress to client',
      date: addDays(new Date(), 2),
      time: '11:00',
      duration: 60,
      type: 'meeting' as const,
      attendees: ['Alice Johnson', 'Bob Smith'],
      status: 'tentative' as const
    },
    {
      id: '5',
      title: 'Design review',
      description: 'Review new UI/UX designs',
      date: addDays(new Date(), 1),
      time: '15:00',
      duration: 45,
      type: 'event' as const,
      attendees: ['Carol Davis', 'David Wilson'],
      status: 'confirmed' as const
    }
  ];

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

  const handleEventClick = (event: any) => {
    console.log('Event clicked:', event);
  };

  const handleAddEvent = (date: Date) => {
    console.log('Add event for date:', date);
  };

  return (
    <div className="space-y-6 animate-ultra-fade-in">
      <CalendarView
        events={mockCalendarEvents}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onEventClick={handleEventClick}
        onAddEvent={handleAddEvent}
        title="Team Calendar"
        description="Manage team schedules, deadlines, and events"
        role="team_leader"
      />

      {/* Team Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Deadlines */}
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl transition-all duration-300 hover:shadow-2xl animate-ultra-slide-up delay-400">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>Upcoming Deadlines</span>
            </CardTitle>
            <CardDescription>Tasks due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 hover:shadow-md animate-ultra-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-sm">{deadline.task}</h4>
                    <Badge
                      variant={deadline.priority === 'high' ? 'destructive' : deadline.priority === 'medium' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {deadline.priority}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Progress</span>
                      <span className="text-gray-500 font-medium">{deadline.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${deadline.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <div>Assigned to: <span className="font-medium">{deadline.assignee}</span></div>
                    <div>Due: <span className="font-medium">{deadline.dueDate}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Availability */}
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl transition-all duration-300 hover:shadow-2xl animate-ultra-slide-up delay-500">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Team Availability</span>
            </CardTitle>
            <CardDescription>Current team member status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teamMembers.map((member, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-xl text-center hover:shadow-md transition-all duration-300 transform hover:scale-105 animate-ultra-scale-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="text-3xl mb-3">{member.avatar}</div>
                  <h4 className="font-semibold text-sm mb-2">{member.name}</h4>
                  <Badge 
                    variant={member.status === 'available' ? 'default' : member.status === 'busy' ? 'destructive' : 'secondary'} 
                    className="text-xs mb-3"
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
    </div>
  );
};

export default TeamCalendar;
