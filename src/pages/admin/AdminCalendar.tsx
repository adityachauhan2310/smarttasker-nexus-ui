
import React, { useState, useMemo } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar as CalendarIcon, Users, Clock, AlertTriangle } from 'lucide-react';
import { useCalendarEvents, useTasksAsEvents, useAnalytics } from '@/hooks/useApi';
import AddEventModal from '@/components/modals/AddEventModal';
import EditEventModal from '@/components/modals/EditEventModal';

import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  type: 'hr' | 'task' | 'meeting' | 'deadline' | 'event' | 'maintenance' | 'audit';
  priority: 'low' | 'medium' | 'high';
  status: 'cancelled' | 'confirmed' | 'tentative';
}

const AdminCalendar = () => {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const startDate = moment(date).startOf('month').subtract(1, 'week').toISOString();
  const endDate = moment(date).endOf('month').add(1, 'week').toISOString();

  const { data: calendarData } = useCalendarEvents({ startDate, endDate });
  const { events: taskEvents } = useTasksAsEvents({ startDate, endDate });
  const analytics = useAnalytics();

  // Transform calendar events for react-big-calendar
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    
    // Add calendar events
    if (calendarData?.events) {
      calendarData.events.forEach(event => {
        events.push({
          id: event.id,
          title: event.title,
          start: new Date(event.date),
          end: new Date(event.date),
          type: event.type,
          priority: event.priority,
          status: event.status,
          resource: { source: 'calendar', data: event }
        });
      });
    }
    
    // Add task events
    taskEvents.forEach(event => {
      events.push({
        id: event.id,
        title: `📋 ${event.title}`,
        start: new Date(event.date),
        end: new Date(event.date),
        type: event.type,
        priority: event.priority,
        status: event.status,
        resource: { source: 'task', data: event }
      });
    });
    
    return events;
  }, [calendarData, taskEvents]);

  // Event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad';
    let borderColor = '#3174ad';
    
    // Color by type
    switch (event.type) {
      case 'hr':
        backgroundColor = '#dc2626';
        borderColor = '#dc2626';
        break;
      case 'task':
        backgroundColor = '#059669';
        borderColor = '#059669';
        break;
      case 'meeting':
        backgroundColor = '#7c3aed';
        borderColor = '#7c3aed';
        break;
      case 'deadline':
        backgroundColor = '#ea580c';
        borderColor = '#ea580c';
        break;
      case 'maintenance':
        backgroundColor = '#64748b';
        borderColor = '#64748b';
        break;
      case 'audit':
        backgroundColor = '#be185d';
        borderColor = '#be185d';
        break;
      default:
        backgroundColor = '#3174ad';
        borderColor = '#3174ad';
    }
    
    // Adjust opacity for status
    if (event.status === 'cancelled') {
      backgroundColor = '#9ca3af';
      borderColor = '#9ca3af';
    } else if (event.status === 'tentative') {
      backgroundColor = backgroundColor + '80'; // Add transparency
    }
    
    return {
      style: {
        backgroundColor,
        borderColor,
        color: 'white',
        border: '1px solid ' + borderColor,
        borderRadius: '4px',
        fontSize: '12px',
        padding: '2px 4px'
      }
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setDate(start);
    setShowAddModal(true);
  };

  // Calculate upcoming events for stats
  const upcomingEvents = calendarEvents.filter(event => 
    moment(event.start).isAfter(moment()) && 
    moment(event.start).isBefore(moment().add(7, 'days'))
  ).length;

  const highPriorityEvents = calendarEvents.filter(event => 
    event.priority === 'high' && 
    moment(event.start).isAfter(moment())
  ).length;

  const todaysEvents = calendarEvents.filter(event => 
    moment(event.start).isSame(moment(), 'day')
  ).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
          <p className="text-gray-600 mt-1">Manage events, deadlines, and schedules</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Today's Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{todaysEvents}</div>
            <p className="text-xs text-blue-600 mt-1">Events scheduled today</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Upcoming (7 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{upcomingEvents}</div>
            <p className="text-xs text-green-600 mt-1">Events this week</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{highPriorityEvents}</div>
            <p className="text-xs text-orange-600 mt-1">Critical events pending</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{analytics?.data?.eventsCount || 0}</div>
            <p className="text-xs text-purple-600 mt-1">All calendar events</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Event Calendar
            </span>
            <div className="flex gap-2">
              <Badge variant="outline">
                <div className="w-2 h-2 bg-red-600 rounded-full mr-2"></div>
                HR
              </Badge>
              <Badge variant="outline">
                <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                Tasks
              </Badge>
              <Badge variant="outline">
                <div className="w-2 h-2 bg-purple-600 rounded-full mr-2"></div>
                Meetings
              </Badge>
              <Badge variant="outline">
                <div className="w-2 h-2 bg-orange-600 rounded-full mr-2"></div>
                Deadlines
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            View and manage all events, tasks, and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              popup
              tooltipAccessor="title"
              views={['month', 'week', 'day', 'agenda']}
              step={60}
              showMultiDayTimes
              components={{
                toolbar: ({ label, onNavigate, onView, view: currentView }) => (
                  <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('PREV')}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('TODAY')}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate('NEXT')}
                      >
                        Next
                      </Button>
                    </div>
                    <h2 className="text-xl font-semibold">{label}</h2>
                    <div className="flex gap-2">
                      {['month', 'week', 'day', 'agenda'].map((viewName) => (
                        <Button
                          key={viewName}
                          variant={currentView === viewName ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => onView(viewName as View)}
                        >
                          {viewName.charAt(0).toUpperCase() + viewName.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        selectedDate={date}
      />
      
      {selectedEvent && (
        <EditEventModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          event={selectedEvent.resource?.data}
        />
      )}
    </div>
  );
};

export default AdminCalendar;
