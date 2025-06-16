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
  AlertCircle,
  Check,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

// Form schema validation
const formSchema = z.object({
  name: z.string().min(3, { message: 'Team name must be at least 3 characters' }),
  description: z.string().optional(),
  leaders: z.array(z.string()).min(1, { message: 'At least one team leader is required' }),
  members: z.array(z.string()).default([]),
});

const CreateTeamModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [leaderSearch, setLeaderSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLeaders, setSelectedLeaders] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [submissionError, setSubmissionError] = useState(null);
  
  // Create team mutation hook
  const createTeamMutation = useCreateTeam();
  
  // Fetch users for selection
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    limit: 100
  });

  const users = usersData?.data || [];
  
  // Setup form with validation
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      leaders: [],
      members: [],
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('info');
      setLeaderSearch('');
      setMemberSearch('');
      setSelectedLeaders([]);
      setSelectedMembers([]);
      setSubmissionError(null);
      form.reset({
        name: '',
        description: '',
        leaders: [],
        members: [],
      });
    }
  }, [isOpen, form]);

  // Update form values when selections change
  useEffect(() => {
    form.setValue('leaders', selectedLeaders, { shouldValidate: true });
  }, [selectedLeaders, form]);

  useEffect(() => {
    form.setValue('members', selectedMembers, { shouldValidate: true });
  }, [selectedMembers, form]);

  // Filter users based on role and search queries
  const leaderCandidates = users.filter(user => 
    (user.role === 'admin' || user.role === 'team_leader') &&
    (leaderSearch === '' || 
     user.name?.toLowerCase().includes(leaderSearch.toLowerCase()) ||
     user.email?.toLowerCase().includes(leaderSearch.toLowerCase()))
  );

  const memberCandidates = users.filter(user => 
    user.role === 'team_member' &&
    (memberSearch === '' || 
     user.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
     user.email?.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  // Toggle leader selection - only select one at a time
  const toggleLeaderSelection = (userId) => {
    // If already selected, remove it
    if (selectedLeaders.includes(userId)) {
      setSelectedLeaders(prev => prev.filter(id => id !== userId));
    } else {
      // Otherwise add it
      setSelectedLeaders([userId]); // Only allow one leader selection at a time
    }
  };

  const toggleMemberSelection = (userId) => {
    setSelectedMembers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Form submission handler
  const onSubmit = (data) => {
    console.log("Submitting form with data:", data);
    
    if (!data.leaders || data.leaders.length === 0) {
      toast.error('Please select at least one team leader');
      return;
    }

    if (!data.name) {
      toast.error('Team name is required');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    
    // Adapt to API structure
    const leader = data.leaders[0]; 
    const teamData = {
      name: data.name,
      description: data.description || '',
      leader: leader,
      members: data.members || [],
    };
    
    console.log('Creating team with data:', teamData);
    
    createTeamMutation.mutate(teamData, {
      onSuccess: () => {
        console.log("Team created successfully");
        toast.success('Team created successfully');
        setIsSubmitting(false);
        onClose();
      },
      onError: (error) => {
        console.error("Team creation error:", error);
        setSubmissionError(error.message || 'Failed to create team');
        toast.error('Failed to create team: ' + (error.message || 'Unknown error'));
        setIsSubmitting(false);
      },
    });
  };

  // Helper to get user name by ID
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Create a new team with a leader and members
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">
                  <Building className="h-4 w-4 mr-2" />
                  Team Info
                </TabsTrigger>
                <TabsTrigger value="leaders">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Leaders ({selectedLeaders.length})
                </TabsTrigger>
                <TabsTrigger value="members">
                  <Users className="h-4 w-4 mr-2" />
                  Members ({selectedMembers.length})
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
                
                <TabsContent value="leaders" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Team Leader</h3>
                    <FormMessage>{form.formState.errors.leaders?.message}</FormMessage>
                  </div>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search leaders by name or email..."
                      className="pl-8"
                      value={leaderSearch}
                      onChange={(e) => setLeaderSearch(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    {isLoadingUsers ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : leaderCandidates.length > 0 ? (
                      <div className="space-y-2">
                        {leaderCandidates.map(user => (
                          <div 
                            key={user.id}
                            onClick={() => toggleLeaderSelection(user.id)}
                            className={`
                              flex items-center p-3 border rounded-lg cursor-pointer
                              ${selectedLeaders.includes(user.id) 
                                ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/20' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                            `}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <Avatar>
                                <AvatarFallback className="bg-blue-600">
                                  {user.name?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                {user.role === 'admin' ? 'Admin' : 'Team Leader'}
                              </Badge>
                              
                              {selectedLeaders.includes(user.id) && (
                                <Check className="h-5 w-5 text-blue-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-md">
                        <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">No leaders found</p>
                      </div>
                    )}
                    
                    {selectedLeaders.length > 0 && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Selected Leader:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedLeaders.map((leaderId) => (
                            <Badge 
                              key={leaderId}
                              variant="default"
                              className="flex items-center gap-1"
                            >
                              {getUserName(leaderId)} (Primary)
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <FormDescription className="mt-2">
                      Select the team leader.
                    </FormDescription>
                  </div>
                </TabsContent>
                
                <TabsContent value="members" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Team Members</h3>
                  </div>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search members by name or email..."
                      className="pl-8"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    {isLoadingUsers ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : memberCandidates.length > 0 ? (
                      <div className="space-y-2">
                        {memberCandidates.map(user => (
                          <div 
                            key={user.id}
                            onClick={() => toggleMemberSelection(user.id)}
                            className={`
                              flex items-center p-3 border rounded-lg cursor-pointer
                              ${selectedMembers.includes(user.id) 
                                ? 'bg-green-50 border-green-500 dark:bg-green-900/20' 
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                            `}
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <Avatar>
                                <AvatarFallback className="bg-green-600">
                                  {user.name?.[0] || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">
                                Team Member
                              </Badge>
                              
                              {selectedMembers.includes(user.id) && (
                                <Check className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-md">
                        <AlertCircle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">No members found</p>
                      </div>
                    )}
                    
                    {selectedMembers.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Selected Members:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedMembers.map(memberId => (
                            <Badge 
                              key={memberId}
                              variant="outline"
                              className="flex items-center gap-1"
                            >
                              {getUserName(memberId)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <FormDescription className="mt-2">
                      Select team members. You can add more later.
                    </FormDescription>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
            
            {submissionError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-md mt-4">
                <p className="text-sm font-medium">Error: {submissionError}</p>
              </div>
            )}
            
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