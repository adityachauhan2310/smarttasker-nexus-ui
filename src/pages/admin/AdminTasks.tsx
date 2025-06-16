import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Eye, Filter, Plus, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import EditTaskModal from '@/components/modals/EditTaskModal';
import ViewTaskModal from '@/components/modals/ViewTaskModal';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import TaskCard from '@/components/ui/TaskCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
}

// Pagination interface
interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const AdminTasks = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<Task | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTaskToView, setSelectedTaskToView] = useState<Task | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Function to fetch tasks
  const fetchTasks = useCallback(async () => {
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
      
      // Always include tasks with due dates to ensure calendar tasks show up
      queryParams.append('includeDueDates', 'true');
      
      console.log('Fetching tasks with params:', queryParams.toString());
      
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
      
      console.log('Tasks fetched:', data.data.length);
      
      // Update state with fetched data
      setTasks(data.data || []);
      setPagination({
        total: data.pagination.total || 0,
        page: data.pagination.page || 1,
        limit: data.pagination.limit || 20,
        pages: data.pagination.pages || 0,
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks. Please try again.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, priorityFilter]);

  // Fetch tasks on component mount and when dependencies change
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  // Check for taskId query param to open a specific task
  useEffect(() => {
    // Parse the URL for a taskId param
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get('taskId');
    
    if (taskId) {
      // Find the task in the loaded tasks or fetch it directly
      const handleTaskFromQuery = async () => {
        try {
          // Try to find in already loaded tasks
          let taskToView = tasks.find(t => t._id === taskId);
          
          // If not found in loaded tasks, fetch directly
          if (!taskToView) {
            const response = await fetch(`/api/tasks/${taskId}`, {
              credentials: 'include'
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch task');
            }
            
            const data = await response.json();
            
            if (data.success && data.data && data.data.task) {
              taskToView = data.data.task;
            } else {
              throw new Error('Invalid task data received');
            }
          }
          
          if (taskToView) {
            // Show the task view modal
            setSelectedTaskToView(taskToView);
            setIsViewModalOpen(true);
            
            // Clean the URL (remove the query param)
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('Error handling task from query:', error);
          toast.error('Failed to load the requested task');
        }
      };
      
      // Wait for tasks to load first
      if (!loading) {
        handleTaskFromQuery();
      }
    }
  }, [tasks, loading]);

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
    setStatusFilter(value === "all" ? "" : value);
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Handle priority filter change
  const handlePriorityFilter = (value: string) => {
    setPriorityFilter(value === "all" ? "" : value);
    setPagination(prev => ({
      ...prev,
      page: 1
    }));
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
  };

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Handle task creation success
  const handleTaskCreated = () => {
    fetchTasks();
  };

  // Handle task status change
  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    try {
      console.log(`Updating task ${taskId} status to ${newStatus}`);
      
      // Try task-specific status endpoint first
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include'
      });
      
      // If that fails, try the general update endpoint
      if (response.status === 404 || response.status === 405) {
        console.log('Status-specific endpoint not found, trying general update endpoint');
        const generalResponse = await fetch(`/api/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
          credentials: 'include'
        });
        
        if (!generalResponse.ok) {
          const errorText = await generalResponse.text();
          console.error('Error response from general update:', errorText);
          throw new Error('Failed to update task status');
        }
      } else if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response from status update:', errorText);
        throw new Error('Failed to update task status');
      }
      
      // Update the task locally
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId 
            ? { ...task, status: newStatus } 
            : task
        )
      );
      
      toast.success(`Task status updated to ${newStatus.replace('_', ' ')}`);
      // Fetch tasks to ensure the UI is in sync with the server
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  // Handle task deletion
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

  // Handle task edit
  const handleEditTask = (taskId: string) => {
    // First close the view modal if open
    setIsViewModalOpen(false);
    
    // Find the task to edit
    const taskToEdit = tasks.find(task => task._id === taskId);
    if (taskToEdit) {
      // Navigate or show edit modal for the task
      setSelectedTaskToEdit(taskToEdit);
      setIsEditModalOpen(true);
    } else {
      toast.error('Task not found');
    }
  };

  // Handle task view
  const handleViewTask = (taskId: string) => {
    // Find the task to view
    const taskToView = tasks.find(task => task._id === taskId);
    if (taskToView) {
      // Navigate or show view modal for the task
      setSelectedTaskToView(taskToView);
      setIsViewModalOpen(true);
    } else {
      toast.error('Task not found');
    }
  };

  // Check if current user can delete a task
  const canDeleteTask = (task: Task) => {
    if (!user) return false;
    
    // Admin can delete any task
    if (user.role === 'admin') return true;
    
    // Users can delete tasks they created
    if (task.createdBy._id === user._id) return true;
    
    // Team leaders can delete tasks created by their team members
    // This would require additional logic checking team membership
    
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage system-wide tasks and administrative duties
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-10" 
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
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
                  <SelectItem value="all">All Priorities</SelectItem>
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

      {/* Tasks List */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-2/5" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-9 w-20" />
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : tasks.length === 0 ? (
          // No tasks found message
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 mb-4">No tasks found</p>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Task
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Task cards
          tasks.map((task) => (
            <TaskCard 
              key={task._id}
              task={task}
              onStatusChange={handleTaskStatusChange}
              onEdit={handleEditTask}
              onView={handleViewTask}
              onDelete={() => setTaskToDelete(task._id)}
              currentUserId={user?._id as string}
              userRole={user?.role as string}
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

      {/* Task Creation Modal */}
      <CreateTaskModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        teamMembers={[]}
        onTaskCreated={handleTaskCreated}
      />

      {/* Task Edit Modal */}
      {selectedTaskToEdit && (
        <EditTaskModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          task={selectedTaskToEdit}
          teamMembers={[]}
          onTaskUpdated={fetchTasks}
        />
      )}

      {/* Task View Modal */}
      {selectedTaskToView && (
        <ViewTaskModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          task={selectedTaskToView}
          onEdit={() => handleEditTask(selectedTaskToView._id)}
        />
      )}

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

export default AdminTasks;
