import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Target, Users, Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import CreateTaskModal from '@/components/modals/CreateTaskModal';
import TaskCard from '@/components/ui/TaskCard';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

// Types
interface TeamMember {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  activeTaskCount?: number;
  skills?: string[];
}

interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  dueDate?: string;
  tags: string[];
  estimatedTime?: number;
}

const TaskAssignment = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState({
    members: true,
    tasks: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    if (!user?.teamId) return;
    
    try {
      setLoading(prev => ({ ...prev, members: true }));
      const response = await fetch(`/api/teams/${user.teamId}/members`);
      
      if (!response.ok) throw new Error('Failed to fetch team members');
      
      const data = await response.json();
      
      // Get task counts for each member
      const membersWithTaskCounts = await Promise.all(
        data.data.map(async (member: TeamMember) => {
          try {
            const taskResponse = await fetch(`/api/tasks?assignedTo=${member._id}&status=pending,in_progress`);
            if (taskResponse.ok) {
              const taskData = await taskResponse.json();
              return {
                ...member,
                activeTaskCount: taskData.pagination?.total || 0
              };
            }
            return member;
          } catch (error) {
            console.error(`Error fetching tasks for ${member.name}:`, error);
            return member;
          }
        })
      );
      
      setTeamMembers(membersWithTaskCounts);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, members: false }));
    }
  }, [user?.teamId]);

  // Fetch unassigned tasks for this team
  const fetchUnassignedTasks = useCallback(async () => {
    if (!user?.teamId) return;
    
    try {
      setLoading(prev => ({ ...prev, tasks: true }));
      const response = await fetch(`/api/tasks?teamId=${user.teamId}&assignedTo=null&status=pending`);
      
      if (!response.ok) throw new Error('Failed to fetch unassigned tasks');
      
      const data = await response.json();
      setUnassignedTasks(data.data || []);
    } catch (error) {
      console.error('Error fetching unassigned tasks:', error);
      toast.error('Failed to load unassigned tasks. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  }, [user?.teamId]);

  // Fetch data on component mount
  useEffect(() => {
    fetchTeamMembers();
    fetchUnassignedTasks();
  }, [fetchTeamMembers, fetchUnassignedTasks]);

  // Handle task creation success
  const handleTaskCreated = () => {
    fetchUnassignedTasks();
  };

  // Handle task assignment
  const assignTask = async (taskId: string, userId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId }),
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to assign task');

      toast.success('Task assigned successfully');
      fetchUnassignedTasks();
      fetchTeamMembers();
    } catch (error) {
      console.error('Error assigning task:', error);
      toast.error('Failed to assign task. Please try again.');
    }
  };
  
  // Filter team members by search term
  const filteredTeamMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Assignment</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and assign tasks to your team members
          </p>
        </div>
        <Button 
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unassigned Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Unassigned Tasks</span>
              </CardTitle>
              <CardDescription>Tasks waiting to be assigned to team members</CardDescription>
            </CardHeader>
            <CardContent>
              {loading.tasks ? (
                // Loading skeletons
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 w-full" />
                  ))}
                </div>
              ) : unassignedTasks.length === 0 ? (
                // No tasks message
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No unassigned tasks</p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Task
                  </Button>
                </div>
              ) : (
                // Task list
                <div className="space-y-4">
                  {unassignedTasks.map(task => (
                    <div key={task._id} className="border rounded-lg p-4">
                      <TaskCard 
                        task={task}
                        showAssignee={false}
                      />
                      <div className="mt-3 border-t pt-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Assign this task to:</p>
                        <div className="flex flex-wrap gap-2">
                          {teamMembers.map(member => (
                            <Button
                              key={member._id}
                              variant="outline"
                              size="sm"
                              onClick={() => assignTask(task._id, member._id)}
                            >
                              <Avatar className="h-4 w-4 mr-1">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback className="text-xs">
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {member.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search team members..." 
                  className="pl-10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {loading.members ? (
              // Loading skeletons
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredTeamMembers.length === 0 ? (
              // No members found
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No team members found
              </p>
            ) : (
              // Member list
              <div className="space-y-4">
                {filteredTeamMembers.map((member) => (
                  <div key={member._id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white text-sm">
                          {member.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{member.name}</h4>
                        <p className="text-xs text-gray-500">
                          {member.activeTaskCount || 0} active task{member.activeTaskCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Creation Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTaskCreated={handleTaskCreated}
        userRole="team_leader"
        userId={user?._id}
        teamId={user?.teamId}
      />
    </div>
  );
};

export default TaskAssignment;
