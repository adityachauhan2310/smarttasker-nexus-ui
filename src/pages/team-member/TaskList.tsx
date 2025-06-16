import React, { useState, useEffect, useCallback } from 'react';
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
import { Search, Filter, Calendar, User as UserIcon, Clock, CheckCircle2, Target, UserCheck, Plus } from 'lucide-react';
import TaskCard from '@/components/ui/TaskCard';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CreateTaskModal from '@/components/modals/CreateTaskModal';

// Task interface
interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  createdBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  teamId?: {
    _id: string;
    name: string;
  };
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isAssigned?: boolean; // Whether created by the user or assigned by someone else
}

// Pagination interface
interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Define a User interface that matches what's expected from useAuth
interface User {
  _id: string;
  role: string;
  name: string;
  email: string;
}

const TaskList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const { user } = useAuth();

  // Function to fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      // Add filters if set
      if (searchTerm) queryParams.append('search', searchTerm);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (priorityFilter) queryParams.append('priority', priorityFilter);
      
      // For "all" tab, get tasks where user is either creator or assignee
      if (activeTab === 'all') {
        queryParams.append('assignedTo', (user as User)._id);
      } 
      // For "assigned" tab, get tasks assigned to user but not created by user
      else if (activeTab === 'assigned') {
        queryParams.append('assignedTo', (user as User)._id);
        queryParams.append('excludeCreatedBy', (user as User)._id);
      } 
      // For "personal" tab, get tasks created by user
      else if (activeTab === 'personal') {
        queryParams.append('createdBy', (user as User)._id);
      }
      
      // Make the API request
      const response = await fetch(`/api/tasks?${queryParams.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch tasks');
      }
      
      // Add isAssigned flag to differentiate between assigned and self-created tasks
      const tasksWithAssignmentFlag = data.data.map((task: Task) => ({
        ...task,
        isAssigned: task.createdBy._id !== (user as User)._id && task.assignedTo?._id === (user as User)._id
      }));
      
      // Update state with fetched data
      setTasks(tasksWithAssignmentFlag);
      setPagination({
        total: data.pagination.total || 0,
        page: data.pagination.page || 1,
        limit: data.pagination.limit || 20,
        pages: data.pagination.pages || 0,
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [(user as User)?._id, pagination.page, pagination.limit, searchTerm, statusFilter, priorityFilter, activeTab]);

  // Fetch tasks on component mount and when dependencies change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Handle search input
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Reset to page 1 when search changes
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle status filter change
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle priority filter change
  const handlePriorityFilter = (value: string) => {
    setPriorityFilter(value);
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle task status change
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to update task status');
      
      toast.success(`Task marked as ${newStatus.replace('_', ' ')}`);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  // Handle delete task
  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to delete task');
      
      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setTaskToDelete(null);
    }
  };

  // Handle view task
  const handleViewTask = (taskId: string) => {
    // Navigate to task detail page
    window.location.href = `/tasks/${taskId}`;
  };

  // Handle edit task
  const handleEditTask = (taskId: string) => {
    // Navigate to edit task page or show edit task modal
    toast.info('Edit task functionality coming soon');
  };

  // Get task stats for the current view
  const getTaskStats = () => {
    return {
      all: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
    };
  };

  // Task creation handler
  const handleTaskCreated = () => {
    // Refresh tasks after creation
    fetchTasks();
  };

  const stats = getTaskStats();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your assigned tasks and personal projects
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
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
            <UserIcon className="h-4 w-4" />
            <span>Personal</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6 mt-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-lg hover:scale-105 transition-transform">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.all}</div>
                <div className="text-xs opacity-90">All Tasks</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:scale-105 transition-transform">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-xs opacity-90">Pending</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg hover:scale-105 transition-transform">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{stats.in_progress}</div>
                <div className="text-xs opacity-90">In Progress</div>
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
                    <UserIcon className="h-3 w-3 mr-1" />
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
                      onChange={handleSearch}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          <div className="space-y-4">
            {loading ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={`skeleton-${index}`} className="h-32 w-full" />
              ))
            ) : tasks.length === 0 ? (
              // Empty state
              <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No tasks found</p>
                  <Button 
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Task
                  </Button>
                </CardContent>
              </Card>
            ) : (
              // Task cards
              tasks.map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onStatusChange={handleTaskStatusChange}
                  onView={handleViewTask}
                  onEdit={handleEditTask}
                  onDelete={task.isAssigned ? undefined : () => setTaskToDelete(task._id)}
                  currentUserId={(user as User)?._id}
                  userRole={(user as User)?.role}
                  showTeam={true}
                  className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl"
                />
              ))
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center px-2">
                    Page {pagination.page} of {pagination.pages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onTaskCreated={handleTaskCreated}
        teamMembers={[]}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!taskToDelete} onOpenChange={(isOpen) => !isOpen && setTaskToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and remove it from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => taskToDelete && handleDeleteTask(taskToDelete)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskList;
