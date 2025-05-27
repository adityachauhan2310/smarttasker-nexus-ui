
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, Calendar, User, Clock, CheckCircle2, Target, UserCheck } from 'lucide-react';
import TaskCard from '../../components/ui/TaskCard';

const TaskList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // Mock tasks with assignment info
  const allTasks = [
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
      isAssigned: true, // Assigned by team leader
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
      createdBy: '1',
      createdByName: 'John Doe',
      dueDate: '2024-01-18',
      createdAt: '2024-01-12',
      updatedAt: '2024-01-15',
      tags: ['design', 'ui/ux'],
      comments: [],
      attachments: [],
      isAssigned: false, // Self-created
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
      isAssigned: true, // Assigned by team leader
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
      isAssigned: true, // Assigned by team leader
    },
    {
      id: '5',
      title: 'Personal learning: React Patterns',
      description: 'Study advanced React patterns and best practices',
      status: 'in_progress' as const,
      priority: 'low' as const,
      assigneeId: '1',
      assigneeName: 'John Doe',
      assigneeAvatar: '/api/placeholder/32/32',
      createdBy: '1',
      createdByName: 'John Doe',
      dueDate: '2024-01-25',
      createdAt: '2024-01-14',
      updatedAt: '2024-01-15',
      tags: ['learning', 'react'],
      comments: [],
      attachments: [],
      isAssigned: false, // Self-created
    },
  ];

  const getFilteredTasks = (taskType: string) => {
    let tasks = allTasks;
    
    // Filter by task type
    if (taskType === 'assigned') {
      tasks = tasks.filter(task => task.isAssigned);
    } else if (taskType === 'personal') {
      tasks = tasks.filter(task => !task.isAssigned);
    }
    
    // Apply other filters
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  };

  const getTaskStats = (taskType: string) => {
    const tasks = taskType === 'all' ? allTasks : 
                  taskType === 'assigned' ? allTasks.filter(t => t.isAssigned) :
                  allTasks.filter(t => !t.isAssigned);
                  
    return {
      all: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      in_review: tasks.filter(t => t.status === 'in_review').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  };

  const filteredTasks = getFilteredTasks(activeTab);
  const stats = getTaskStats(activeTab);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your assigned tasks and personal projects
        </p>
      </div>

      {/* Task Type Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-lg">
          <TabsTrigger value="all" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-green-600 data-[state=active]:text-white">
            <Target className="h-4 w-4" />
            <span>All Tasks</span>
          </TabsTrigger>
          <TabsTrigger value="assigned" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white">
            <UserCheck className="h-4 w-4" />
            <span>Assigned</span>
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-blue-600 data-[state=active]:text-white">
            <User className="h-4 w-4" />
            <span>Personal</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-lg hover:scale-105 transition-transform">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.all}</div>
                <div className="text-xs opacity-90">All Tasks</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:scale-105 transition-transform">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.todo}</div>
                <div className="text-xs opacity-90">To Do</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg hover:scale-105 transition-transform">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.in_progress}</div>
                <div className="text-xs opacity-90">In Progress</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:scale-105 transition-transform">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.in_review}</div>
                <div className="text-xs opacity-90">In Review</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg hover:scale-105 transition-transform">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-xs opacity-90">Completed</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
                {activeTab === 'assigned' && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Assigned by team
                  </Badge>
                )}
                {activeTab === 'personal' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    <User className="h-3 w-3 mr-1" />
                    Self-created
                  </Badge>
                )}
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
                      className="pl-10 bg-white dark:bg-gray-700"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48 bg-white dark:bg-gray-700">
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
                  <SelectTrigger className="w-full md:w-48 bg-white dark:bg-gray-700">
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
            {filteredTasks.map((task, index) => (
              <div 
                key={task.id} 
                className="animate-fade-in" 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TaskCard task={task} showAssignmentBadge={activeTab === 'all'} />
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No tasks found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === 'assigned' 
                    ? "You don't have any assigned tasks matching these filters."
                    : activeTab === 'personal'
                    ? "You haven't created any personal tasks yet."
                    : "Try adjusting your filters to see more tasks."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskList;
