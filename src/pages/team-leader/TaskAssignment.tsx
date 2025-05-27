
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Target, Users, Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const TaskAssignment = () => {
  const [selectedMember, setSelectedMember] = useState('');

  const teamMembers = [
    { id: '1', name: 'Alice Johnson', avatar: '/api/placeholder/40/40', currentTasks: 3, skills: ['Frontend', 'React'] },
    { id: '2', name: 'Bob Smith', avatar: '/api/placeholder/40/40', currentTasks: 2, skills: ['Backend', 'Node.js'] },
    { id: '3', name: 'Carol Davis', avatar: '/api/placeholder/40/40', currentTasks: 4, skills: ['Design', 'UI/UX'] },
    { id: '4', name: 'David Wilson', avatar: '/api/placeholder/40/40', currentTasks: 1, skills: ['QA', 'Testing'] },
  ];

  const pendingAssignments = [
    { title: 'Fix login bug', priority: 'high', estimatedHours: 4, skills: ['Backend'] },
    { title: 'Update dashboard UI', priority: 'medium', estimatedHours: 8, skills: ['Frontend', 'Design'] },
    { title: 'Write test cases', priority: 'low', estimatedHours: 6, skills: ['QA'] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Assignment</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Create and assign tasks to your team members
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Creation Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Create New Task</span>
              </CardTitle>
              <CardDescription>Assign tasks to team members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input id="task-title" placeholder="Enter task title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Assign To</Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-description">Description</Label>
                <Textarea 
                  id="task-description" 
                  placeholder="Describe the task requirements..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
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
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input id="due-date" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated-hours">Estimated Hours</Label>
                  <Input id="estimated-hours" type="number" placeholder="8" />
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                <Target className="h-4 w-4 mr-2" />
                Create & Assign Task
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Team Members</span>
            </CardTitle>
            <CardDescription>Current workload overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div key={member.id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-3 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white text-sm">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{member.name}</h4>
                      <p className="text-xs text-gray-500">{member.currentTasks} active tasks</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {member.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Pending Assignments</span>
          </CardTitle>
          <CardDescription>Tasks waiting to be assigned</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingAssignments.map((task, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <Badge
                      variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{task.estimatedHours}h estimated</span>
                    <span>Skills: {task.skills.join(', ')}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Assign
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskAssignment;
