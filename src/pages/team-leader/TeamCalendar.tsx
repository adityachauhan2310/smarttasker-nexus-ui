
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Users } from 'lucide-react';

const TeamCalendar = () => {
  const calendarData = [
    { date: '2024-01-15', tasks: [
      { title: 'Team standup', time: '09:00', type: 'meeting' },
      { title: 'Code review deadline', time: '14:00', type: 'deadline' },
    ]},
    { date: '2024-01-16', tasks: [
      { title: 'Sprint planning', time: '10:00', type: 'meeting' },
      { title: 'Design review', time: '15:00', type: 'review' },
    ]},
    { date: '2024-01-17', tasks: [
      { title: 'Client presentation', time: '11:00', type: 'meeting' },
    ]},
  ];

  const upcomingDeadlines = [
    { task: 'Website redesign', assignee: 'Alice Johnson', dueDate: '2024-01-20', priority: 'high' },
    { task: 'API documentation', assignee: 'Bob Smith', dueDate: '2024-01-22', priority: 'medium' },
    { task: 'User testing report', assignee: 'Carol Davis', dueDate: '2024-01-25', priority: 'low' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Calendar</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          View team schedules, deadlines, and upcoming events
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>This Week</span>
              </CardTitle>
              <CardDescription>Team schedule and important dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {calendarData.map((day, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {new Date(day.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </h3>
                    <div className="space-y-2">
                      {day.tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">{task.time}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{task.title}</span>
                          <Badge 
                            variant={task.type === 'meeting' ? 'default' : task.type === 'deadline' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {task.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Deadlines */}
        <Card>
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
                  <p className="text-xs text-gray-500 mb-1">Assigned to: {deadline.assignee}</p>
                  <p className="text-xs text-gray-500">Due: {deadline.dueDate}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Schedule Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Availability</span>
          </CardTitle>
          <CardDescription>Current team member status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['Alice Johnson', 'Bob Smith', 'Carol Davis', 'David Wilson'].map((member, index) => (
              <div key={index} className="p-4 border rounded-lg text-center">
                <h4 className="font-medium text-sm mb-2">{member}</h4>
                <Badge variant={index % 2 === 0 ? 'default' : 'secondary'} className="text-xs">
                  {index % 2 === 0 ? 'Available' : 'Busy'}
                </Badge>
                <p className="text-xs text-gray-500 mt-2">
                  {index % 2 === 0 ? 'Free until 3 PM' : 'In meeting until 2 PM'}
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
