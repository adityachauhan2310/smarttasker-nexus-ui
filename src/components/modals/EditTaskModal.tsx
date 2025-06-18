import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateTask, useUsers } from '@/hooks/useApi';
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
} from '@/components/ui/form';
import { CalendarIcon, CheckCircle, Circle, Clock, Edit, User } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Task, UpdateTaskData } from '@/hooks/useApi';

const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional(),
  estimatedTime: z.string().optional(),
  assignedTo: z.string().optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type EditTaskModalProps = {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
};

const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const updateTaskMutation = useUpdateTask();
  const [date, setDate] = React.useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined);
  
  const { data: usersResponse, isLoading: isLoadingUsers } = useUsers({
    limit: 100
  });

  const users = usersResponse?.data || [];
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      estimatedTime: task.estimatedTime?.toString() || '',
      assignedTo: task.assignedTo || '',
      tags: task.tags?.join(', ') || '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const taskData: UpdateTaskData = {
        title: values.title,
        description: values.description,
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate?.toISOString(),
        estimatedTime: values.estimatedTime ? parseInt(values.estimatedTime) : undefined,
        assignedTo: values.assignedTo || undefined,
        tags: values.tags?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
      };

      await updateTaskMutation.mutateAsync({ taskId: task.id, taskData });
      
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="h-5 w-5" />
            <span>Edit Task</span>
          </DialogTitle>
          <DialogDescription>
            Update task details
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
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
                      placeholder="Enter task description"
                      className="resize-none"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">
                        <span className="flex items-center gap-2"><Circle className="h-3 w-3 text-gray-400" /> Pending</span>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <span className="flex items-center gap-2"><Clock className="h-3 w-3 text-blue-500" /> In Progress</span>
                      </SelectItem>
                      <SelectItem value="completed">
                        <span className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-green-500" /> Completed</span>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <span className="flex items-center gap-2"><Circle className="h-3 w-3 text-red-500" /> Cancelled</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className="w-[240px] pl-3 text-left font-normal"
                        >
                          {date ? (
                            format(date, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={(date) =>
                          date < new Date()
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estimatedTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Time (hours)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Enter estimated time"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" /> 
                    <span>Assign To</span>
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a user" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingUsers ? (
                        <SelectItem value="loading" disabled>Loading users...</SelectItem>
                      ) : (
                        users.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags (comma separated)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter tags"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4 mt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending ? (
                  <>
                    Updating...
                  </>
                ) : (
                  'Update Task'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;
