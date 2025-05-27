
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Target, User, X, CheckCircle } from 'lucide-react';
import { TaskData } from '../../hooks/useGroqChat';

interface TaskPreviewCardProps {
  task: TaskData;
  onConfirm: (task: TaskData) => void;
  onCancel: () => void;
}

const TaskPreviewCard: React.FC<TaskPreviewCardProps> = ({ task, onConfirm, onCancel }) => {
  const [editedTask, setEditedTask] = useState<TaskData>(task);

  const handleConfirm = () => {
    onConfirm(editedTask);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 animate-slide-up">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span>Task Preview</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Task Title</Label>
          <Input
            id="title"
            value={editedTask.title}
            onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
            className="bg-white dark:bg-gray-800"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={editedTask.description || ''}
            onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
            placeholder="Add task description..."
            className="bg-white dark:bg-gray-800"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={editedTask.priority}
              onValueChange={(value) => setEditedTask({ ...editedTask, priority: value as TaskData['priority'] })}
            >
              <SelectTrigger className="bg-white dark:bg-gray-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              value={editedTask.dueDate || ''}
              onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
              placeholder="e.g., tomorrow at 2pm"
              className="bg-white dark:bg-gray-800"
            />
          </div>
        </div>
        
        {/* Preview */}
        <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Preview:</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{editedTask.title}</span>
              <Badge variant={getPriorityColor(editedTask.priority || 'medium')}>
                {editedTask.priority}
              </Badge>
            </div>
            {editedTask.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{editedTask.description}</p>
            )}
            {editedTask.dueDate && (
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <CalendarDays className="h-3 w-3" />
                <span>Due: {editedTask.dueDate}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-3 pt-2">
          <Button onClick={handleConfirm} className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            Create Task
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskPreviewCard;
