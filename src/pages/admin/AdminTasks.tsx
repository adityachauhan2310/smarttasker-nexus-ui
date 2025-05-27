
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const AdminTasks = () => {
  const tasks = [
    {
      id: '1',
      title: 'System Maintenance',
      description: 'Perform routine system maintenance and updates',
      status: 'in_progress',
      priority: 'high',
      assignee: 'John Doe',
      dueDate: '2024-01-20',
      team: 'System Admin',
    },
    {
      id: '2',
      title: 'User Access Review',
      description: 'Review and audit user access permissions',
      status: 'todo',
      priority: 'medium',
      assignee: 'Sarah Smith',
      dueDate: '2024-01-25',
      team: 'Security',
    },
    {
      id: '3',
      title: 'Backup Verification',
      description: 'Verify backup systems are working correctly',
      status: 'completed',
      priority: 'high',
      assignee: 'Mike Johnson',
      dueDate: '2024-01-15',
      team: 'System Admin',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Tasks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage system-wide tasks and administrative duties
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search tasks..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                    <Badge
                      variant={
                        task.status === 'completed' ? 'default' :
                        task.status === 'in_progress' ? 'secondary' : 'outline'
                      }
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                    <Badge
                      variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'secondary' : 'outline'
                      }
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">{task.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Assigned to: <span className="font-medium text-gray-900 dark:text-white">{task.assignee}</span></span>
                    <span>Team: <span className="font-medium text-gray-900 dark:text-white">{task.team}</span></span>
                    <span>Due: <span className="font-medium text-gray-900 dark:text-white">{task.dueDate}</span></span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminTasks;
