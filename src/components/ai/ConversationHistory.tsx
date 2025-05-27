
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock } from 'lucide-react';
import { Conversation } from '../../hooks/useGroqChat';

interface ConversationHistoryProps {
  conversations: Conversation[];
  currentId: string;
  onSwitch: (id: string) => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({ 
  conversations, 
  currentId, 
  onSwitch 
}) => {
  // Mock conversations for demo
  const mockConversations: Conversation[] = [
    {
      id: 'default',
      title: 'Task Management',
      lastMessage: 'What should I prioritize today?',
      timestamp: '2 min ago',
      messages: []
    },
    {
      id: 'team-meeting',
      title: 'Team Meeting Planning',
      lastMessage: 'Create task: Team standup tomorrow',
      timestamp: '1 hour ago',
      messages: []
    },
    {
      id: 'project-review',
      title: 'Project Review',
      lastMessage: 'Show me project deadlines',
      timestamp: 'Yesterday',
      messages: []
    }
  ];

  const displayConversations = conversations.length > 0 ? conversations : mockConversations;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 mb-3">
        <MessageSquare className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recent Chats</span>
      </div>
      
      {displayConversations.map((conversation) => (
        <Button
          key={conversation.id}
          variant={currentId === conversation.id ? "default" : "ghost"}
          className={`w-full justify-start text-left h-auto py-3 px-3 ${
            currentId === conversation.id 
              ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white' 
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => onSwitch(conversation.id)}
        >
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm truncate">{conversation.title}</span>
              {currentId === conversation.id && (
                <Badge variant="secondary" className="text-xs ml-2">
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs opacity-75 truncate flex-1">{conversation.lastMessage}</p>
              <div className="flex items-center space-x-1 ml-2">
                <Clock className="h-3 w-3 opacity-50" />
                <span className="text-xs opacity-75">{conversation.timestamp}</span>
              </div>
            </div>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default ConversationHistory;
