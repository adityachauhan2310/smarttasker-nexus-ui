
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Task } from '../../types/task';
import { Calendar, Clock, User, MessageCircle, Paperclip, CheckCircle2 } from 'lucide-react';
import { format, isAfter, isBefore, addDays } from 'date-fns';

interface TaskCardProps {
  task: Task;
  showActions?: boolean;
  onStatusChange?: (taskId: string, newStatus: Task['status']) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, showActions = true, onStatusChange }) => {
  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'low':
        return 'border-l-green-500';
      case 'medium':
        return 'border-l-yellow-500';
      case 'high':
        return 'border-l-orange-500';
      case 'urgent':
        return 'border-l-red-500';
      default:
        return 'border-l-gray-300';
    }
  };

  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), new Date()) && task.status !== 'completed';
  const isDueSoon = task.dueDate && isBefore(new Date(task.dueDate), addDays(new Date(), 3)) && task.status !== 'completed';

  const handleStatusChange = (newStatus: Task['status']) => {
    if (onStatusChange) {
      onStatusChange(task.id, newStatus);
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 border-l-4 ${getPriorityColor(task.priority)} ${isOverdue ? 'ring-2 ring-red-200' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Link 
              to={`/tasks/${task.id}`} 
              className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
            >
              {task.title}
            </Link>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(task.status)} variant="secondary">
                {task.status.replace('_', ' ')}
              </Badge>
              <Badge 
                variant={task.priority === 'urgent' || task.priority === 'high' ? 'destructive' : 'outline'}
                className="text-xs"
              >
                {task.priority}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
              {isDueSoon && !isOverdue && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  Due Soon
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
          {task.description}
        </p>

        {/* Task Info */}
        <div className="space-y-2">
          {task.assigneeName && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="h-4 w-4" />
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.assigneeAvatar} />
                <AvatarFallback className="text-xs">
                  {task.assigneeName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span>{task.assigneeName}</span>
            </div>
          )}
          
          {task.dueDate && (
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>Due {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>Created {format(new Date(task.createdAt), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {task.comments.length > 0 && (
              <div className="flex items-center space-x-1">
                <MessageCircle className="h-4 w-4" />
                <span>{task.comments.length}</span>
              </div>
            )}
            {task.attachments.length > 0 && (
              <div className="flex items-center space-x-1">
                <Paperclip className="h-4 w-4" />
                <span>{task.attachments.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        {showActions && task.status !== 'completed' && (
          <div className="flex space-x-2 pt-2 border-t">
            {task.status === 'todo' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('in_progress')}
                className="flex-1"
              >
                Start Work
              </Button>
            )}
            {task.status === 'in_progress' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleStatusChange('in_review')}
                className="flex-1"
              >
                Ready for Review
              </Button>
            )}
            {task.status === 'in_review' && (
              <Button
                size="sm"
                variant="default"
                onClick={() => handleStatusChange('completed')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskCard;
