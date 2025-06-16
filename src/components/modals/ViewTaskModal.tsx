import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CalendarIcon,
  Clock,
  AlertTriangle,
  Check,
  Edit,
  Trash2,
  Tag,
  User,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDeleteTask } from '@/hooks/useApi';

interface ViewTaskModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  task: any;
  onEdit?: () => void;
}

const ViewTaskModal: React.FC<ViewTaskModalProps> = ({ 
  isOpen, 
  open,
  onClose, 
  onOpenChange,
  task, 
  onEdit 
}) => {
  const deleteTaskMutation = useDeleteTask();
  
  // Use either isOpen or open prop
  const isDialogOpen = isOpen !== undefined ? isOpen : open !== undefined ? open : false;
  
  // Handle dialog close
  const handleDialogClose = (openState: boolean) => {
    if (!openState) {
      if (onClose) onClose();
      if (onOpenChange) onOpenChange(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      return;
    }

    try {
      await deleteTaskMutation.mutateAsync(task._id);
      toast.success('Task deleted successfully');
      handleDialogClose(false);
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Delete task error:', error);
    }
  };

  if (!task) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return format(date, 'PPP');
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleDialogClose(false)}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center justify-between">
            <span className="mr-2">{task.title}</span>
            <Badge variant={getPriorityColor(task.priority)}>
              {task.priority}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(task.status)}`}>
              {task.status === 'in_progress' ? 'In Progress' : task.status}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {task.description && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</h3>
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {task.dueDate && (
            <div className="flex items-start space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Due Date</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(task.dueDate)}</p>
              </div>
            </div>
          )}

          {task.assignedTo && (
            <div className="flex items-start space-x-2">
              <User className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Assigned To</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{task.assignedTo.name}</p>
              </div>
            </div>
          )}

          {task.createdBy && (
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Created By</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{task.createdBy.name}</p>
              </div>
            </div>
          )}

          {task.tags && task.tags.length > 0 && (
            <div className="flex items-start space-x-2">
              <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Tags</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {task.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-2">
            <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Created</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(task.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={() => handleDialogClose(false)}>
            Close
          </Button>
          <Button variant="default" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDeleteTask}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewTaskModal;
