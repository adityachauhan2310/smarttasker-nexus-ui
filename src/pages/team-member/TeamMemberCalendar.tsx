
import React, { useState } from 'react';
import CalendarView from '@/components/ui/CalendarView';
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
    </div>
  );
};

export default TeamMemberCalendar;
