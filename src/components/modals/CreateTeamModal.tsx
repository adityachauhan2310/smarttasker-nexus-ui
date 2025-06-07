import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Building, Loader2, Users, UserCheck, Info } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Form schema validation
const formSchema = z.object({
  name: z.string().min(3, { message: 'Team name must be at least 3 characters' }),
  description: z.string().optional(),
  leaderId: z.string({ required_error: 'A team leader is required' }),
  memberIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof formSchema>;

type CreateTeamModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
}) => {
  const createTeamMutation = useCreateTeam();
  const [selectedLeader, setSelectedLeader] = React.useState<string | null>(null);
  
  // Fetch users for leader and member selection
  const { data: usersData, isLoading: isLoadingUsers, refetch: refetchUsers } = useUsers({
    limit: 100
  });

  const users = usersData?.data || [];
  
  React.useEffect(() => {
    if (isOpen) {
      // Refresh users data when modal is opened
      refetchUsers();
      
      // Log the users data to debug
      console.log('Users data:', users);
    }
  }, [isOpen, refetchUsers, users]);
  
  // Filter users for team leaders and members
  const possibleLeaders = users.filter(user => 
    user.role === 'admin' || user.role === 'team_leader'
  );
  
  // Only show users with role 'team_member' - explicitly filter by the exact role
  const possibleMembers = users.filter(user => 
    user.role === 'team_member'
  );
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      leaderId: '',
      memberIds: [],
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      if (!values.leaderId) {
        toast.error("Please select a team leader");
        return;
      }
      
      // Create the payload with explicit type checking to avoid undefined errors
      const payload = {
        name: values.name,
        description: values.description || '',
        leader: values.leaderId,
        members: Array.isArray(values.memberIds) ? values.memberIds : [],
      };
      
      console.log('Submitting team data:', payload);

      await createTeamMutation.mutateAsync(payload);
      
      form.reset();
      setSelectedLeader(null);
      toast.success("Team created successfully");
      onClose();
    } catch (error: any) {
      console.error('Failed to create team:', error);
      
      // More detailed error handling
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
        toast.error(error.response.data.message || "Validation failed. Please check your inputs.");
      } else {
        toast.error("Failed to create team. Please try again.");
      }
    }
  };

  // Handle leader selection
  const handleLeaderSelect = (leaderId: string) => {
    setSelectedLeader(leaderId);
    form.setValue("leaderId", leaderId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Create New Team</span>
          </DialogTitle>
          <DialogDescription>
            Create a new team and assign a leader
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
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
                      placeholder="Enter team description (optional)"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Team Leader Select - Redesigned as radio buttons */}
            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" /> 
                    Team Leader
                    </FormLabel>
                    <FormDescription>
                    Select one leader for this team
                    </FormDescription>
                  
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center p-4 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading users...</span>
                    </div>
                  ) : possibleLeaders.length === 0 ? (
                    <div className="p-4 border rounded-md text-center">
                      No users with leadership roles available
                    </div>
                  ) : (
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={handleLeaderSelect}
                        className="space-y-1"
                      >
                        {possibleLeaders.map(leader => (
                          <div key={leader.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
                            <RadioGroupItem value={leader.id} id={`leader-${leader.id}`} />
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarImage src={leader.avatar} alt={leader.name} />
                              <AvatarFallback className="bg-primary">
                                {leader.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <label 
                                htmlFor={`leader-${leader.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {leader.name}
                                <p className="text-xs text-gray-500">{leader.role}</p>
                              </label>
                            </div>
                        </div>
                      ))}
                      </RadioGroup>
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Team Members Multi-select */}
            <FormField
              control={form.control}
              name="memberIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                    Team Members
                    </FormLabel>
                    <FormDescription>
                    Select members to add to this team (optional)
                    </FormDescription>
                  
                  {isLoadingUsers ? (
                    <div className="flex items-center justify-center p-4 border rounded-md">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading users...</span>
                    </div>
                  ) : possibleMembers.length === 0 ? (
                    <div className="p-4 border rounded-md text-center">
                      <p className="text-amber-600 mb-2">No team members available</p>
                      <p className="text-sm text-gray-500">Add users with 'team_member' role first</p>
                    </div>
                  ) : (
                    <>
                      {/* Selected members display */}
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border">
                          <span className="text-sm text-gray-500 w-full mb-1">Selected:</span>
                          {field.value.map(memberId => {
                            const member = users.find(u => u.id === memberId);
                            return member ? (
                              <Badge 
                                key={memberId}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {member.name}
                                <button 
                                  type="button"
                                  className="ml-1 text-xs hover:text-red-500"
                                  onClick={() => {
                                    const currentValues = field.value || [];
                                    field.onChange(
                                      currentValues.filter((value) => value !== memberId)
                                    );
                                  }}
                                >
                                  ×
                                </button>
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                      
                                <FormControl>
                        <ScrollArea className="h-[150px] border rounded-md p-2">
                          {possibleMembers.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                  <Checkbox
                                id={`member-${user.id}`}
                                    checked={field.value?.includes(user.id)}
                                    onCheckedChange={(checked) => {
                                      const currentValues = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValues, user.id]);
                                  } else {
                                    field.onChange(
                                            currentValues.filter((value) => value !== user.id)
                                          );
                                  }
                                }}
                              />
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="bg-secondary">
                                  {user.name?.charAt(0).toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <label 
                                htmlFor={`member-${user.id}`}
                                className="flex-1 text-sm cursor-pointer"
                              >
                                {user.name}
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </label>
                                  </div>
                      ))}
                    </ScrollArea>
                      </FormControl>
                    </>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4 mt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={createTeamMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                disabled={createTeamMutation.isPending || !form.getValues("leaderId")}
              >
                {createTeamMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Team'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamModal; 