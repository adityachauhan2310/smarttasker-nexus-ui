
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users, Target } from 'lucide-react';

const TeamManagement = () => {
  const teams = [
    {
      id: '1',
      name: 'Development Team',
      description: 'Frontend and backend development',
      leader: { name: 'Sarah Smith', avatar: '/api/placeholder/40/40' },
      members: 8,
      activeTasks: 15,
      completedTasks: 42,
      status: 'active',
    },
    {
      id: '2',
      name: 'Design Team',
      description: 'UI/UX design and branding',
      leader: { name: 'Mike Johnson', avatar: '/api/placeholder/40/40' },
      members: 5,
      activeTasks: 7,
      completedTasks: 28,
      status: 'active',
    },
    {
      id: '3',
      name: 'Marketing Team',
      description: 'Marketing and content creation',
      leader: { name: 'Emily Davis', avatar: '/api/placeholder/40/40' },
      members: 6,
      activeTasks: 12,
      completedTasks: 35,
      status: 'active',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage teams across your organization
          </p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {team.status}
                </Badge>
              </div>
              <CardDescription>{team.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Leader */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={team.leader.avatar} alt={team.leader.name} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white text-sm">
                    {team.leader.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {team.leader.name}
                  </p>
                  <p className="text-xs text-gray-500">Team Leader</p>
                </div>
              </div>

              {/* Team Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {team.members}
                  </div>
                  <div className="text-xs text-gray-500">Members</div>
                </div>
                <div className="p-2">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {team.activeTasks}
                  </div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
                <div className="p-2">
                  <div className="flex items-center justify-center mb-1">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {team.completedTasks}
                  </div>
                  <div className="text-xs text-gray-500">Done</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Team
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Edit Team
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeamManagement;
