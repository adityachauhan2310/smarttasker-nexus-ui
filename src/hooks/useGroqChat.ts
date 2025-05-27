
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

export const useGroqChat = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [taskPreview, setTaskPreview] = useState<TaskData | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>('default');

  // Mock Groq API call - replace with actual Groq integration
  const callGroqAPI = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Mock responses based on message content
    if (userMessage.toLowerCase().includes('create') || userMessage.toLowerCase().includes('add task')) {
      return `I'll help you create that task. Let me extract the details from your message: "${userMessage}"`;
    }
    
    if (userMessage.toLowerCase().includes('tasks for today') || userMessage.toLowerCase().includes('today')) {
      return `Based on your current tasks, you have 3 tasks due today:
      
**High Priority:**
- Complete project proposal (Due: 5:00 PM)
- Client meeting preparation (Due: 2:00 PM)

**Medium Priority:**
- Review team reports (Due: End of day)

Would you like me to help you prioritize these or create a schedule?`;
    }
    
    if (userMessage.toLowerCase().includes('overdue')) {
      return `You have 2 overdue tasks that need immediate attention:

🔴 **Urgent:** Submit quarterly budget (Overdue by 2 days)
🟡 **High:** Update project timeline (Overdue by 1 day)

I recommend addressing the quarterly budget first. Would you like me to help you break these down into smaller steps?`;
    }
    
    if (userMessage.toLowerCase().includes('priority') || userMessage.toLowerCase().includes('focus')) {
      return `Based on your deadlines and task priorities, I recommend focusing on:

1. **Client meeting preparation** (Due in 4 hours) - High impact
2. **Complete project proposal** (Due today) - Critical deadline
3. **Review team reports** (Due today) - Can be done after meetings

This sequence ensures you're prepared for important meetings while meeting critical deadlines. Would you like me to set reminders for these?`;
    }
    
    return `I understand you're asking about: "${userMessage}". I'm here to help you manage your tasks more effectively. You can ask me to:

• Create new tasks from natural language
• Show your task schedule and priorities  
• Mark tasks as complete
• Analyze your workload and suggest optimizations
• Set reminders and deadlines

What would you like to do next?`;
  };

  const extractTaskFromMessage = (message: string): TaskData | null => {
    // Simple task extraction logic - in real implementation, use NLP
    const taskKeywords = ['create', 'add', 'task', 'meeting', 'deadline', 'reminder'];
    const hasTaskIntent = taskKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    if (!hasTaskIntent) return null;
    
    // Extract potential task title
    const titleMatch = message.match(/(?:create|add)(?:\s+(?:a\s+)?task[:\s]*)?([^.!?]+)/i);
    const title = titleMatch ? titleMatch[1].trim() : message;
    
    // Extract date/time
    const dateMatch = message.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|next week)/i);
    const timeMatch = message.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    
    let dueDate = '';
    if (dateMatch || timeMatch) {
      const date = dateMatch ? dateMatch[1] : 'today';
      const time = timeMatch ? ` at ${timeMatch[1]}` : '';
      dueDate = `${date}${time}`;
    }
    
    // Extract priority
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
      // Check for task creation intent
      const taskData = extractTaskFromMessage(content);
      if (taskData) {
        setTaskPreview(taskData);
      }
      
      // Call Groq API
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
    // Here you would save the task to your backend
    console.log('Creating task:', taskData);
    setTaskPreview(null);
    
    toast({
      title: 'Task Created',
      description: `"${taskData.title}" has been added to your tasks.`,
    });
    
    // Add confirmation message
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
    // In a real app, load conversation messages from storage
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
