
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  User, 
  Calendar, 
  Flag, 
  CheckCircle2, 
  Circle, 
  Eye,
  UserCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  createdBy: string;
  createdByName: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  comments: any[];
  attachments: any[];
  isAssigned: boolean;
}

interface TaskCardProps {
  task: Task;
  showAssignmentBadge?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, showAssignmentBadge = false }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'in_review': return 'bg-purple-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'urgent': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleViewTask = () => {
    navigate(`/tasks/${task.id}`);
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
              {task.title}
            </CardTitle>
            <CardDescription className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {task.description}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end space-y-2 ml-3">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(task.status)}`} />
            {showAssignmentBadge && (
              <Badge 
                variant="secondary" 
                className={task.isAssigned 
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400" 
                  : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                }
              >
                {task.isAssigned ? (
                  <>
                    <UserCheck className="h-3 w-3 mr-1" />
                    Assigned
                  </>
                ) : (
                  <>
                    <User className="h-3 w-3 mr-1" />
                    Personal
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Task Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={getPriorityColor(task.priority)}>
              <Flag className="h-3 w-3 mr-1" />
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {getStatusIcon(task.status)}
              <span className="ml-1 capitalize">{task.status.replace('_', ' ')}</span>
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(task.updatedAt)}</span>
            </div>
          </div>
        </div>

        {/* Assignee */}
        <div className="flex items-center space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={task.assigneeAvatar} alt={task.assigneeName} />
            <AvatarFallback className="text-xs">
              {task.assigneeName.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {task.assigneeName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {task.isAssigned ? `Assigned by ${task.createdByName}` : 'Self-created'}
            </p>
          </div>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{task.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewTask}
            className="flex items-center space-x-1 hover:scale-105 transition-transform"
          >
            <Eye className="h-3 w-3" />
            <span>View</span>
          </Button>
          
          <Badge variant="outline" className="text-xs">
            ID: {task.id}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
