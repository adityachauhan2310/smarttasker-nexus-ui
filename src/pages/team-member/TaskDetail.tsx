import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  Paperclip, 
  CheckCircle, 
  ArrowLeft,
  Edit,
  Play,
  Pause
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TaskDetail = () => {
  const { id } = useParams();
  const [newComment, setNewComment] = useState('');

  // Mock task data - in real app this would come from API
  const task = {
    id: id || '1',
    title: 'Update user authentication flow',
    description: 'Implement new JWT-based authentication system with refresh tokens and improved security measures. This includes updating the login/logout flow, implementing token refresh logic, and updating all API endpoints to use the new authentication system.',
    status: 'in_progress',
    priority: 'high',
    progress: 65,
    assignee: {
      name: 'John Doe',
      avatar: '/api/placeholder/40/40',
      email: 'john.doe@company.com'
    },
    createdBy: {
      name: 'Sarah Smith',
      avatar: '/api/placeholder/40/40'
    },
    dueDate: '2024-01-25',
    createdAt: '2024-01-15',
    estimatedHours: 16,
    loggedHours: 10.5,
    tags: ['Authentication', 'Security', 'Backend'],
    comments: [
      {
        id: '1',
        author: { name: 'Sarah Smith', avatar: '/api/placeholder/40/40' },
        content: 'Please make sure to implement proper error handling for expired tokens.',
        createdAt: '2024-01-16 10:30',
      },
      {
        id: '2',
        author: { name: 'John Doe', avatar: '/api/placeholder/40/40' },
        content: 'Working on the refresh token logic now. Should have an update by end of day.',
        createdAt: '2024-01-17 14:15',
      },
    ],
    attachments: [
      { name: 'auth-flow-diagram.png', size: '2.4 MB', type: 'image' },
      { name: 'api-specs.pdf', size: '1.8 MB', type: 'document' },
    ],
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      console.log('Adding comment:', newComment);
      setNewComment('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/tasks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tasks
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{task.title}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <Badge
              variant={task.status === 'completed' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}
            >
              {task.status.replace('_', ' ')}
            </Badge>
            <Badge
              variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
            >
              {task.priority} priority
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-green-600">
            {task.status === 'in_progress' ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause Task
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Task
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {task.description}
              </p>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
              <CardDescription>Task completion status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{task.loggedHours}</div>
                    <div className="text-sm text-blue-600">Hours Logged</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{task.estimatedHours}</div>
                    <div className="text-sm text-gray-600">Estimated Hours</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Comments</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Comments */}
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                      <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm">{comment.author.name}</span>
                        <span className="text-xs text-gray-500">{comment.createdAt}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="border-t pt-4">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mb-3"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add Comment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Task Info */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Assigned to</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                      <AvatarFallback className="text-xs">{task.assignee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{task.assignee.name}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{task.dueDate}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{task.createdAt}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Created by</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.createdBy.avatar} alt={task.createdBy.name} />
                      <AvatarFallback className="text-xs">{task.createdBy.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{task.createdBy.name}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Paperclip className="h-5 w-5" />
                <span>Attachments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {task.attachments.map((file, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <Paperclip className="h-4 w-4 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.size}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Complete
              </Button>
              <Button className="w-full" variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Log Time
              </Button>
              <Button className="w-full" variant="outline">
                <Paperclip className="h-4 w-4 mr-2" />
                Add Attachment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
