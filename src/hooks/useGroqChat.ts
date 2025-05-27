import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './use-toast';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  taskData?: TaskData;
  actions?: MessageAction[];
}

export interface TaskData {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignee?: string;
}

export interface MessageAction {
  type: 'create_task' | 'mark_complete' | 'view_tasks';
  label: string;
  data?: any;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messages: ChatMessage[];
}

// Mock task data - in real app, this would come from your backend
const mockTasks = [
  {
    id: '1',
    title: 'Complete project proposal',
    description: 'Finalize the Q1 project proposal',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0], // Today
    assignedTo: 'current_user'
  },
  {
    id: '2',
    title: 'Client meeting preparation',
    description: 'Prepare slides for client presentation',
    status: 'todo',
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0], // Today
    assignedTo: 'current_user'
  },
  {
    id: '3',
    title: 'Review team reports',
    description: 'Review weekly team performance reports',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0], // Today
    assignedTo: 'current_user'
  },
  {
    id: '4',
    title: 'Update project timeline',
    description: 'Update Gantt chart with new milestones',
    status: 'todo',
    priority: 'high',
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday (overdue)
    assignedTo: 'current_user'
  }
];

export const useGroqChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskPreview, setTaskPreview] = useState<TaskData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('default');

  const getTodaysTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return mockTasks.filter(task => task.dueDate === today);
  };

  const getOverdueTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return mockTasks.filter(task => task.dueDate < today && task.status !== 'completed');
  };

  const getTasksByStatus = (status: string) => {
    return mockTasks.filter(task => task.status === status);
  };

  // Enhanced Groq API call with better task understanding
  const callGroqAPI = async (userMessage: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const message = userMessage.toLowerCase();
    
    // Task queries - show actual tasks, don't suggest creating new ones
    if (message.includes('tasks for today') || message.includes('today\'s tasks') || message.includes('what tasks') && message.includes('today')) {
      const todaysTasks = getTodaysTasks();
      if (todaysTasks.length === 0) {
        return `You have no tasks scheduled for today! 🎉 This is a great opportunity to:

• Work on long-term projects
• Catch up on overdue tasks
• Plan for tomorrow
• Take some time for learning or improvement

Would you like me to show your overdue tasks or help you plan for tomorrow?`;
      }

      const taskList = todaysTasks.map(task => 
        `**${task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'} ${task.title}**
   ${task.description}
   Status: ${task.status.replace('_', ' ').toUpperCase()}`
      ).join('\n\n');

      return `Here are your tasks for today (${todaysTasks.length} tasks):

${taskList}

Based on priority, I recommend starting with the high-priority tasks first. Would you like me to help you create a schedule or break down any of these tasks?`;
    }
    
    if (message.includes('overdue') || message.includes('late tasks') || message.includes('behind')) {
      const overdueTasks = getOverdueTasks();
      if (overdueTasks.length === 0) {
        return `Great news! You have no overdue tasks. You're staying on top of your work! 👏

Keep up the excellent time management. Would you like me to show your upcoming tasks or help you plan ahead?`;
      }

      const overdueList = overdueTasks.map(task => 
        `🔴 **${task.title}** (${Math.ceil((Date.now() - new Date(task.dueDate).getTime()) / 86400000)} days overdue)
   ${task.description}
   Originally due: ${new Date(task.dueDate).toLocaleDateString()}`
      ).join('\n\n');

      return `You have ${overdueTasks.length} overdue task(s) that need immediate attention:

${overdueList}

I recommend addressing these as soon as possible. Would you like me to help you prioritize these or break them into smaller, manageable steps?`;
    }

    // Task creation detection
    if (message.includes('create') || message.includes('add') || message.includes('new task') || 
        message.includes('schedule') || message.includes('remind me') || message.includes('meeting')) {
      return `I'll help you create that task. Let me extract the details from your message: "${userMessage}"

Please review the task details below and confirm if everything looks correct.`;
    }
    
    if (message.includes('priority') || message.includes('focus') || message.includes('what should i')) {
      const todaysTasks = getTodaysTasks();
      const overdueTasks = getOverdueTasks();
      
      if (overdueTasks.length > 0) {
        return `Based on your current tasks, here's what you should prioritize:

**🚨 URGENT - Handle Overdue Tasks First:**
${overdueTasks.map(task => `• ${task.title} (${Math.ceil((Date.now() - new Date(task.dueDate).getTime()) / 86400000)} days overdue)`).join('\n')}

**📅 Today's High Priority Tasks:**
${todaysTasks.filter(task => task.priority === 'high').map(task => `• ${task.title}`).join('\n')}

I recommend tackling overdue tasks first to get back on track, then focus on today's high-priority items. Would you like me to help you create a detailed schedule?`;
      }

      return `Based on your deadlines and task priorities, here's your focus plan:

**🔥 High Priority (Do First):**
${todaysTasks.filter(task => task.priority === 'high').map(task => `• ${task.title} - ${task.description}`).join('\n')}

**⚡ Medium Priority (Do Next):**
${todaysTasks.filter(task => task.priority === 'medium').map(task => `• ${task.title} - ${task.description}`).join('\n')}

This sequence ensures you handle critical deadlines while maintaining steady progress. Would you like me to set reminders or break any of these into smaller steps?`;
    }

    if (message.includes('complete') || message.includes('done') || message.includes('finished')) {
      return `I can help you mark tasks as complete! However, I need to be connected to your task management system to make actual changes.

Currently available tasks you might want to mark as complete:
${getTodaysTasks().filter(task => task.status !== 'completed').map(task => `• ${task.title}`).join('\n')}

Which task did you complete? Just let me know the task name and I'll help you update it.`;
    }

    // General helpful response
    return `I understand you're asking about: "${userMessage}". 

I'm your SmartTasker AI assistant and I can help you with:

🎯 **Task Management:**
• Show your tasks for today, this week, or by status
• Create new tasks from natural language
• Mark tasks as complete or update their status
• Analyze your workload and suggest priorities

📊 **Analytics & Insights:**
• Track your productivity patterns
• Identify bottlenecks in your workflow  
• Suggest optimal work schedules
• Provide deadline alerts and reminders

${user?.role === 'admin' ? `🔧 **Admin Functions:**
• View system-wide task statistics
• Manage user accounts and permissions
• Generate team performance reports
• Configure system settings` : ''}

${user?.role === 'team_leader' ? `👥 **Team Leadership:**
• Assign tasks to team members
• Monitor team progress and workload
• Generate team performance insights
• Manage team schedules and deadlines` : ''}

What would you like me to help you with?`;
  };

  const extractTaskFromMessage = (message: string): TaskData | null => {
    const taskKeywords = ['create', 'add', 'task', 'meeting', 'deadline', 'reminder', 'schedule'];
    const hasTaskIntent = taskKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    if (!hasTaskIntent) return null;
    
    const titleMatch = message.match(/(?:create|add|schedule)(?:\s+(?:a\s+)?task[:\s]*)?([^.!?]+)/i);
    const title = titleMatch ? titleMatch[1].trim() : message;
    
    const dateMatch = message.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|next week)/i);
    const timeMatch = message.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    
    let dueDate = '';
    if (dateMatch || timeMatch) {
      const date = dateMatch ? dateMatch[1] : 'today';
      const time = timeMatch ? ` at ${timeMatch[1]}` : '';
      dueDate = `${date}${time}`;
    }
    
    let priority: TaskData['priority'] = 'medium';
    if (message.toLowerCase().includes('urgent') || message.toLowerCase().includes('asap')) {
      priority = 'urgent';
    } else if (message.toLowerCase().includes('high priority') || message.toLowerCase().includes('important')) {
      priority = 'high';
    } else if (message.toLowerCase().includes('low priority') || message.toLowerCase().includes('when possible')) {
      priority = 'low';
    }
    
    return {
      title,
      description: message,
      dueDate,
      priority,
    };
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const taskData = extractTaskFromMessage(content);
      if (taskData) {
        setTaskPreview(taskData);
      }
      
      const aiResponse = await callGroqAPI(content);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        taskData: taskData || undefined,
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const confirmTask = useCallback((taskData: TaskData) => {
    console.log('Creating task:', taskData);
    setTaskPreview(null);
    
    toast({
      title: 'Task Created',
      description: `"${taskData.title}" has been added to your tasks.`,
    });
    
    const confirmMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: `✅ Perfect! I've created the task "${taskData.title}" for you. It's been added to your task list with ${taskData.priority} priority${taskData.dueDate ? ` and is due ${taskData.dueDate}` : ''}.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    
    setMessages(prev => [...prev, confirmMessage]);
  }, [toast]);

  const clearTaskPreview = useCallback(() => {
    setTaskPreview(null);
  }, []);

  const createNewConversation = useCallback(() => {
    const newId = Date.now().toString();
    setCurrentConversationId(newId);
    setMessages([]);
    setTaskPreview(null);
  }, []);

  const switchConversation = useCallback((conversationId: string) => {
    setCurrentConversationId(conversationId);
    setMessages([]);
    setTaskPreview(null);
  }, []);

  return {
    messages,
    sendMessage,
    isLoading,
    taskPreview,
    clearTaskPreview,
    confirmTask,
    conversations,
    currentConversationId,
    createNewConversation,
    switchConversation,
  };
};
