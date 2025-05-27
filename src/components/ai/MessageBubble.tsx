
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, User, Clock, CheckCircle, Target } from 'lucide-react';
import { ChatMessage, TaskData } from '../../hooks/useGroqChat';
import { User as UserType } from '../../types/auth';

interface MessageBubbleProps {
  message: ChatMessage;
  user: UserType | null;
  onCreateTask?: (taskData: TaskData) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, user, onCreateTask }) => {
  const isUser = message.type === 'user';

  const formatContent = (content: string) => {
    // Format markdown-like content
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(\d+\..*?)(?=\d+\.|$)/gs, '<div class="list-item">$1</div>')
      .replace(/^(🔴|🟡|🟢|•)\s*(.*$)/gm, '<div class="bullet-point"><span class="bullet">$1</span> $2</div>');
  };

  return (
    <div className={`flex space-x-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'order-first' : ''}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm transition-all hover:shadow-md ${
            isUser
              ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white ml-auto'
              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
          }`}
        >
          <div 
            className={`text-sm ${isUser ? 'text-white' : 'text-gray-900 dark:text-white'}`}
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
          
          {/* Task Actions */}
          {message.taskData && onCreateTask && (
            <div className="mt-3 pt-3 border-t border-white/20 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-75">Detected task creation</span>
                <Button
                  size="sm"
                  variant={isUser ? "secondary" : "default"}
                  onClick={() => onCreateTask(message.taskData!)}
                  className="h-6 px-2 text-xs"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Create Task
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <Clock className="h-3 w-3" />
          <span>{message.timestamp}</span>
        </div>
      </div>
      
      {isUser && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={user?.avatar} alt={user?.name} />
          <AvatarFallback className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default MessageBubble;
