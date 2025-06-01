
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
    </div>
  );
};

export default TeamCalendar;
