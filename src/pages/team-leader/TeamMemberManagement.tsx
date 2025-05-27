
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Users, Award, Target, MessageSquare } from 'lucide-react';

const TeamMemberManagement = () => {
  const teamMembers = [
    {
      id: '1',
      name: 'Alice Johnson',
      email: 'alice@company.com',
      avatar: '/api/placeholder/40/40',
      role: 'Senior Developer',
      skills: ['React', 'TypeScript', 'Node.js'],
      activeTasks: 3,
      completedTasks: 28,
      efficiency: 92,
      lastActive: '2 hours ago',
    },
    {
      id: '2',
      name: 'Bob Smith',
      email: 'bob@company.com',
      avatar: '/api/placeholder/40/40',
      role: 'Backend Developer',
      skills: ['Node.js', 'Python', 'PostgreSQL'],
      activeTasks: 2,
      completedTasks: 24,
      efficiency: 88,
      lastActive: '30 minutes ago',
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@company.com',
      avatar: '/api/placeholder/40/40',
      role: 'UI/UX Designer',
      skills: ['Figma', 'Design Systems', 'Prototyping'],
      activeTasks: 4,
      completedTasks: 32,
      efficiency: 95,
      lastActive: '1 hour ago',
    },
    {
      id: '4',
      name: 'David Wilson',
      email: 'david@company.com',
      avatar: '/api/placeholder/40/40',
      role: 'QA Engineer',
      skills: ['Testing', 'Automation', 'Selenium'],
      activeTasks: 1,
      completedTasks: 18,
      efficiency: 78,
      lastActive: '4 hours ago',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Members</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage and monitor your team members' performance
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
          <Users className="h-4 w-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Members</p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Avg Efficiency</p>
                <p className="text-2xl font-bold">
                  {Math.round(teamMembers.reduce((acc, member) => acc + member.efficiency, 0) / teamMembers.length)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Active Tasks</p>
                <p className="text-2xl font-bold">
                  {teamMembers.reduce((acc, member) => acc + member.activeTasks, 0)}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Completed</p>
                <p className="text-2xl font-bold">
                  {teamMembers.reduce((acc, member) => acc + member.completedTasks, 0)}
                </p>
              </div>
              <Award className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Detailed view of your team members and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {teamMembers.map((member) => (
              <div key={member.id} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg">
                        {member.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{member.email}</p>
                      <Badge variant="outline" className="mt-1">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Performance Metrics */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Performance</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Efficiency</span>
                          <span>{member.efficiency}%</span>
                        </div>
                        <Progress value={member.efficiency} className="h-2" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="text-lg font-bold text-green-600">{member.completedTasks}</div>
                          <div className="text-xs text-green-600">Completed</div>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div className="text-lg font-bold text-blue-600">{member.activeTasks}</div>
                          <div className="text-xs text-blue-600">Active</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Activity */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Activity</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Last active: {member.lastActive}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamMemberManagement;
