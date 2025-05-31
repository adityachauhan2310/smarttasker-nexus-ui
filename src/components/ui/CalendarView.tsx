
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addDays, startOfWeek, endOfWeek } from 'date-fns';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'meeting' | 'deadline' | 'task' | 'event' | 'maintenance' | 'audit' | 'hr';
  time?: string;
  duration?: number;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  impact?: 'high' | 'medium' | 'low';
  attendees?: string[];
  assignee?: string;
  assignedBy?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAddEvent?: (date: Date) => void;
  viewMode?: 'month' | 'week' | 'day';
  onViewModeChange?: (mode: 'month' | 'week' | 'day') => void;
  title?: string;
  description?: string;
  role?: 'admin' | 'team_leader' | 'team_member';
}

const CalendarView: React.FC<CalendarViewProps> = ({
  events = [],
  onDateSelect,
  onEventClick,
  onAddEvent,
  viewMode = 'month',
  onViewModeChange,
  title = 'Calendar',
  description = 'Manage your schedule and events',
  role = 'team_member'
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date));
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-500/20 text-blue-600 border-blue-200';
      case 'deadline': return 'bg-red-500/20 text-red-600 border-red-200';
      case 'task': return 'bg-green-500/20 text-green-600 border-green-200';
      case 'event': return 'bg-purple-500/20 text-purple-600 border-purple-200';
      case 'maintenance': return 'bg-orange-500/20 text-orange-600 border-orange-200';
      case 'audit': return 'bg-yellow-500/20 text-yellow-600 border-yellow-200';
      case 'hr': return 'bg-indigo-500/20 text-indigo-600 border-indigo-200';
      default: return 'bg-gray-500/20 text-gray-600 border-gray-200';
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setCurrentDate(date);
    onDateSelect?.(date);
  };

  const handlePrevPeriod = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -7));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 7));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const getViewTitle = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'MMMM d, yyyy');
    } else if (viewMode === 'week') {
      return `Week of ${format(startOfWeek(currentDate), 'MMM d')}`;
    }
    return format(currentDate, 'MMMM yyyy');
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-3 h-80">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDate(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={index}
              className={`border rounded-xl p-3 cursor-pointer transition-all duration-300 hover:shadow-lg animate-ultra-fade-in ${
                isSelected 
                  ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-300 shadow-md' 
                  : isToday
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-300'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={() => handleDateClick(day)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`font-semibold text-sm mb-2 text-center ${
                isToday ? 'text-green-600' : 'text-gray-900 dark:text-white'
              }`}>
                {format(day, 'EEE d')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1.5 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 ${getEventTypeColor(event.type)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick?.(event);
                    }}
                  >
                    <div className="font-medium truncate">{event.time}</div>
                    <div className="truncate">{event.title}</div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium text-center">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate).sort((a, b) => 
      (a.time || '').localeCompare(b.time || '')
    );

    return (
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {dayEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 animate-ultra-fade-in">
            <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No events scheduled for {format(currentDate, 'MMMM d, yyyy')}</p>
            <Button 
              onClick={() => onAddEvent?.(currentDate)}
              className="mt-4 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        ) : (
          dayEvents.map((event, index) => (
            <div
              key={event.id}
              className={`border-l-4 border-blue-500 pl-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-r-xl cursor-pointer transition-all duration-300 hover:shadow-md animate-ultra-slide-up`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onEventClick?.(event)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {event.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant={event.type === 'deadline' ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {event.type}
                  </Badge>
                  {event.priority && (
                    <Badge 
                      variant={event.priority === 'high' ? 'destructive' : event.priority === 'medium' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {event.priority}
                    </Badge>
                  )}
                </div>
              </div>
              {event.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {event.description}
                </p>
              )}
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {event.time && (
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {event.time} {event.duration && `(${event.duration} min)`}
                  </div>
                )}
                {event.attendees && (
                  <div className="flex items-center">
                    <span>{event.attendees.length} attendees</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-semibold text-gray-500">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <div key={`empty-${index}`} className="p-2 h-24"></div>
          ))}
          {daysInMonth.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={`p-2 h-24 border rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md animate-ultra-fade-in ${
                  isSelected 
                    ? 'bg-blue-100 dark:bg-blue-900/20 border-blue-300' 
                    : isToday
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-300'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => handleDateClick(day)}
                style={{ animationDelay: `${index * 10}ms` }}
              >
                <div className={`text-sm font-semibold mb-1 ${
                  isToday ? 'text-green-600' : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded border truncate cursor-pointer transition-all duration-200 hover:scale-105 ${getEventTypeColor(event.type)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-6 animate-ultra-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between animate-ultra-slide-up">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{description}</p>
        </div>
        <div className="flex items-center space-x-3">
          {onViewModeChange && (
            <div className="flex items-center border rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('day')}
                className="rounded-r-none transition-all duration-300"
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('week')}
                className="rounded-none transition-all duration-300"
              >
                Week
              </Button>
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('month')}
                className="rounded-l-none transition-all duration-300"
              >
                Month
              </Button>
            </div>
          )}
          <Button
            onClick={() => onAddEvent?.(selectedDate || new Date())}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Single Calendar Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Calendar View */}
        <div className="xl:col-span-3">
          <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl transition-all duration-300 hover:shadow-2xl animate-ultra-slide-up delay-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold">
                  {getViewTitle()}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPeriod}
                    className="transition-all duration-300 hover:scale-105"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                    className="transition-all duration-300 hover:scale-105"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPeriod}
                    className="transition-all duration-300 hover:scale-105"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'day' && renderDayView()}
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details */}
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl transition-all duration-300 hover:shadow-2xl animate-ultra-slide-up delay-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span>
                {selectedDate ? format(selectedDate, 'MMM d') : 'Select a date'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && (
              <div className="space-y-4">
                <Button
                  onClick={() => onAddEvent?.(selectedDate)}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
                
                {selectedDateEvents.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      Events ({selectedDateEvents.length})
                    </h4>
                    {selectedDateEvents.map((event, index) => (
                      <div
                        key={event.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 hover:shadow-md animate-ultra-scale-in ${getEventTypeColor(event.type)}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                        onClick={() => onEventClick?.(event)}
                      >
                        <div className="font-medium text-sm">{event.title}</div>
                        {event.time && (
                          <div className="flex items-center text-xs mt-1 opacity-75">
                            <Clock className="h-3 w-3 mr-1" />
                            {event.time}
                          </div>
                        )}
                        <Badge variant="outline" className="mt-2 text-xs">
                          {event.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No events on this date</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CalendarView;
