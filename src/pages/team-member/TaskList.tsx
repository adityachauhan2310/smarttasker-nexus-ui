
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Calendar, User, Clock, CheckCircle2 } from 'lucide-react';
import TaskCard from '../../components/ui/TaskCard';

const TaskList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const tasks = [
    {
      id: '1',
      title: 'Update user authentication flow',
      description: 'Implement new JWT-based authentication system with refresh tokens',
      status: 'completed' as const,
      priority: 'high' as const,
      assigneeId: '1',
      assigneeName: 'John Doe',
      assigneeAvatar: '/api/placeholder/32/32',
      createdBy: '2',
      createdByName: 'Sarah Johnson',
      dueDate: '2024-01-15',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-14',
      tags: ['backend', 'security'],
      comments: [],
      attachments: [],
    },
    {
      id: '2',
      title: 'Design dashboard mockups',
      description: 'Create wireframes and high-fidelity mockups for the new admin dashboard',
      status: 'in_progress' as const,
      priority: 'medium' as const,
      assigneeId: '1',
      assigneeName: 'John Doe',
      assigneeAvatar: '/api/placeholder/32/32',
      createdBy: '2',
      createdByName: 'Sarah Johnson',
      dueDate: '2024-01-18',
      createdAt: '2024-01-12',
      updatedAt: '2024-01-15',
      tags: ['design', 'ui/ux'],
      comments: [],
      attachments: [],
    },
    {
      id: '3',
      title: 'Write API documentation',
      description: 'Document all REST endpoints with examples and schema definitions',
      status: 'todo' as const,
      priority: 'low' as const,
      assigneeId: '1',
      assigneeName: 'John Doe',
      assigneeAvatar: '/api/placeholder/32/32',
      createdBy: '3',
      createdByName: 'Mike Wilson',
      dueDate: '2024-01-20',
      createdAt: '2024-01-13',
      updatedAt: '2024-01-13',
      tags: ['documentation', 'api'],
      comments: [],
      attachments: [],
    },
    {
      id: '4',
      title: 'Implement real-time notifications',
      description: 'Add WebSocket support for real-time task updates and notifications',
      status: 'in_review' as const,
      priority: 'high' as const,
      assigneeId: '1',
      assigneeName: 'John Doe',
      assigneeAvatar: '/api/placeholder/32/32',
      createdBy: '2',
      createdByName: 'Sarah Johnson',
      dueDate: '2024-01-16',
      createdAt: '2024-01-08',
      updatedAt: '2024-01-15',
      tags: ['backend', 'websockets'],
      comments: [],
      attachments: [],
    },
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusStats = () => {
    const stats = {
      all: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      in_review: tasks.filter(t => t.status === 'in_review').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage and track your assigned tasks
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.all}</div>
            <div className="text-xs opacity-90">All Tasks</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.todo}</div>
            <div className="text-xs opacity-90">To Do</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.in_progress}</div>
            <div className="text-xs opacity-90">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.in_review}</div>
            <div className="text-xs opacity-90">In Review</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-xs opacity-90">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No tasks found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Try adjusting your filters to see more tasks.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TaskList;
