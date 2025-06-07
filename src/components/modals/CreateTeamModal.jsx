import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTeam, useUsers } from '@/hooks/useApi';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { 
  Building, 
  Loader2, 
  Users, 
  UserCheck, 
  Search,
  AlertCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';

// Form schema validation
const formSchema = z.object({
  name: z.string().min(3, { message: 'Team name must be at least 3 characters' }).max(50, { message: 'Team name cannot exceed 50 characters' }),
  description: z.string().optional(),
  leaderId: z.string({ required_error: 'A team leader is required' }).min(1, { message: 'Team leader is required' }),
  memberIds: z.array(z.string()).optional(),
});

const CreateTeamModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [memberSearch, setMemberSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaderSearch, setLeaderSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  // Create team mutation hook
  const createTeamMutation = useCreateTeam();
  
  // Fetch users for leader and member selection
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useUsers({
    limit: 100
  });

  const users = usersData?.data || [];
  
  // Reset form and selections when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      refetchUsers();
      setActiveTab('info');
      setMemberSearch('');
      setLeaderSearch('');
      setSelectedMembers([]);
      form.reset({
        name: '',
        description: '',
        leaderId: '',
        memberIds: [],
      });
    }
  }, [isOpen]);
  
  // Filter users for leaders and members
  const possibleLeaders = users.filter(user => 
    (user.role === 'admin' || user.role === 'team_leader') && 
    (leaderSearch === '' || user.name.toLowerCase().includes(leaderSearch.toLowerCase()))
  );
  
  // Only show users with role 'team_member' for member selection
  const possibleMembers = users.filter(user => 
    user.role === 'team_member' && 
    (memberSearch === '' || user.name.toLowerCase().includes(memberSearch.toLowerCase()))
  );
  
  // Setup form with validation
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      leaderId: '',
      memberIds: [],
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    setIsSubmitting(true);
    
    const teamData = {
      name: data.name,
      description: data.description || '',
      leader: data.leaderId,
      members: selectedMembers,
    };
    
    console.log('Creating team with data:', teamData);
    
    createTeamMutation.mutate(teamData, {
      onSuccess: () => {
        toast.success('Team created successfully');
        setIsSubmitting(false);
        onClose();
      },
      onError: (error) => {
        console.error('Team creation failed:', error);
        toast.error('Failed to create team: ' + (error.message || 'Unknown error'));
        setIsSubmitting(false);
      },
    });
  });

  const toggleMember = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Create a new team for collaboration
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">
                  <Building className="h-4 w-4 mr-2" />
                  Team Info
                </TabsTrigger>
                <TabsTrigger value="leader">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Team Leader
                </TabsTrigger>
                <TabsTrigger value="members">
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="max-h-[60vh] pr-4">
                <TabsContent value="info" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Team Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter team name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter team description" 
                            {...field} 
                            value={field.value || ''}
                            className="resize-none min-h-[100px]"
                          />
                        </FormControl>
                        <FormDescription>
                          Briefly describe the team's purpose and goals
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="leader" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="leaderId"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormLabel>Team Leader*</FormLabel>
                        <div className="relative mb-2">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                          <Input
                            placeholder="Search users..."
                            className="pl-8"
                            value={leaderSearch}
                            onChange={(e) => setLeaderSearch(e.target.value)}
                          />
                        </div>
                        
                        {isLoadingUsers ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : possibleLeaders.length > 0 ? (
                          <div className="space-y-2">
                            {possibleLeaders.map(user => (
                              <div key={user.id} className={`flex items-center space-x-2 border p-3 rounded-md cursor-pointer ${field.value === user.id ? 'ring-2 ring-blue-500' : ''}`}
                                onClick={() => {
                                  if (field.value === user.id) {
                                    field.onChange('');
                                  } else {
                                    field.onChange(user.id);
                                  }
                                }}
                              >
                                <Checkbox
                                  id={`leader-${user.id}`}
                                  checked={field.value === user.id}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange(user.id);
                                    } else {
                                      field.onChange('');
                                    }
                                  }}
                                />
                                <div className="flex items-center flex-1 space-x-3">
                                  <Avatar>
                                    <AvatarImage src={user.avatar} />
                                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                                      {user.name?.[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <span className="text-sm font-medium">{user.name}</span>
                                    <div className="text-xs text-gray-500">{user.email}</div>
                                  </div>
                                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                    {user.role === 'team_leader' ? 'Team Leader' : 'Admin'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">No eligible team leaders found</p>
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="members" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Team Members</Label>
                      {selectedMembers.length > 0 && (
                        <Badge variant="outline">
                          {selectedMembers.length} selected
                        </Badge>
                      )}
                    </div>
                    
                    <div className="relative mb-2">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search team members..."
                        className="pl-8"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                    </div>
                    
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : possibleMembers.length > 0 ? (
                      <div className="space-y-2">
                        {possibleMembers.map(member => (
                          <div key={member.id} className="flex items-center space-x-2 border p-3 rounded-md">
                            <Checkbox
                              id={`member-${member.id}`}
                              checked={selectedMembers.includes(member.id)}
                              onCheckedChange={() => toggleMember(member.id)}
                            />
                            <div className="flex items-center flex-1 space-x-3">
                              <Avatar>
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                                  {member.name?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <span className="text-sm font-medium">{member.name}</span>
                                <div className="text-xs text-gray-500">{member.email}</div>
                              </div>
                              <Badge variant="outline">Team Member</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">No team members found</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={onClose} 
                type="button"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-green-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Team'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamModal;
