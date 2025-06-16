import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Eye, CheckCircle, Trash2, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Task interface
export interface TaskCardProps {
  task: {
    _id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTo?: {
      _id: string;
      name: string;
      avatar?: string;
    } | null;
    createdBy?: {
      _id: string;
      name: string;
      avatar?: string;
    };
    teamId?: {
      _id: string;
      name: string;
    };
    dueDate?: string;
    tags?: string[];
  };
  onEdit?: (taskId: string) => void;
  onView?: (taskId: string) => void;
  onStatusChange?: (taskId: string, newStatus: string) => void;
  onDelete?: (taskId: string) => void;
  currentUserId?: string;
  userRole?: string;
  showAssignee?: boolean;
  showTeam?: boolean;
  className?: string;
  compact?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onView,
  onStatusChange,
  onDelete,
  currentUserId,
  userRole,
  showAssignee = true,
  showTeam = true,
  className = '',
  compact = false
}) => {
  // Priority badge variant
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

  // Status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  // Handle quick status change
  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(task._id, newStatus);
    }
  };

  // Handle view button click
  const handleViewClick = () => {
    if (onView) {
      onView(task._id);
    }
  };

  // Handle edit button click
  const handleEditClick = () => {
    if (onEdit) {
      onEdit(task._id);
    }
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    if (onDelete) {
      onDelete(task._id);
    }
  };

  // Check if user can delete this task
  const canDeleteTask = () => {
    // No user info or no delete handler
    if (!currentUserId || !onDelete) return false;
    
    // Admin can delete any task
    if (userRole === 'admin') return true;
    
    // User can delete their own tasks
    if (task.createdBy && task.createdBy._id === currentUserId) return true;
    
    // Team leaders might be able to delete team members' tasks
    // (This would need additional logic to check if the user is team leader of the task creator)
    
    return false;
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className={`${compact ? 'py-3 px-4' : 'pt-6'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title and badges */}
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <h3 className={`font-semibold text-gray-900 dark:text-white ${compact ? 'text-sm' : ''}`}>
                {task.title}
              </h3>
              <Badge variant={getStatusBadge(task.status)}>
                {task.status.replace(/_/g, ' ')}
              </Badge>
              <Badge variant={getPriorityBadge(task.priority)}>
                {task.priority}
              </Badge>
            </div>
            
            {/* Description - hide in compact mode */}
            {!compact && task.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}
            
            {/* Task details */}
            <div className={`flex items-center flex-wrap gap-2 text-sm text-gray-500 ${compact ? 'mt-1' : ''}`}>
              {showAssignee && (
                <span>
                  Assigned: <span className="font-medium text-gray-900 dark:text-white">
                    {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                  </span>
                </span>
              )}
              
              {showTeam && task.teamId && (
                <span>
                  Team: <span className="font-medium text-gray-900 dark:text-white">
                    {task.teamId.name}
                  </span>
                </span>
              )}
              
              {task.dueDate && (
                <span>
                  Due: <span className="font-medium text-gray-900 dark:text-white">
                    {formatDate(task.dueDate)}
                  </span>
                </span>
              )}
              
              {/* Tags - show only in full mode */}
              {!compact && task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 w-full">
                  {task.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-2">
            {/* Status dropdown */}
            {onStatusChange && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size={compact ? "icon" : "sm"}
                    className={compact ? "h-8 w-8" : ""}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    {!compact && <span className="ml-1">Status</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuItem 
                    disabled={task.status === 'pending'}
                    onClick={() => handleStatusChange('pending')}
                  >
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    disabled={task.status === 'in_progress'}
                    onClick={() => handleStatusChange('in_progress')}
                  >
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    disabled={task.status === 'completed'}
                    onClick={() => handleStatusChange('completed')}
                  >
                    Completed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            {/* Quick mark as complete button - only for non-completed tasks */}
            {task.status !== 'completed' && onStatusChange && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-green-600"
                onClick={() => handleStatusChange('completed')}
                title="Mark as completed"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            )}
            
            {/* Edit button */}
            {onEdit && (
              <Button 
                variant="outline" 
                size={compact ? "icon" : "sm"} 
                onClick={handleEditClick}
                className={compact ? "h-8 w-8" : ""}
              >
                <Edit className={`h-4 w-4 ${!compact && "mr-1"}`} />
                {!compact && "Edit"}
              </Button>
            )}
            
            {/* View button */}
            {onView && (
              <Button 
                variant="outline" 
                size={compact ? "icon" : "sm"} 
                onClick={handleViewClick}
                className={compact ? "h-8 w-8" : ""}
              >
                <Eye className={`h-4 w-4 ${!compact && "mr-1"}`} />
                {!compact && "View"}
              </Button>
            )}

            {/* Delete button - only if user has permission */}
            {onDelete && canDeleteTask() && (
              <Button 
                variant="outline" 
                size={compact ? "icon" : "sm"} 
                onClick={handleDeleteClick}
                className={compact ? "h-8 w-8 text-red-500" : "text-red-500 hover:text-red-700"}
              >
                <Trash2 className={`h-4 w-4 ${!compact && "mr-1"}`} />
                {!compact && "Delete"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
