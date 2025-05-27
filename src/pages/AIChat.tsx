
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Send, Bot, User, Sparkles, Clock, Plus, CheckCircle, Calendar, Target, Loader2 } from 'lucide-react';
import { useGroqChat } from '../hooks/useGroqChat';
import TaskPreviewCard from '../components/ai/TaskPreviewCard';
import MessageBubble from '../components/ai/MessageBubble';
import SuggestedPrompts from '../components/ai/SuggestedPrompts';
import ConversationHistory from '../components/ai/ConversationHistory';

const AIChat = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
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
  } = useGroqChat();

  const scrollToBottom = () => {
    // Use smooth scrolling with proper behavior
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  useEffect(() => {
    // Only scroll when messages change, with a small delay to ensure DOM is updated
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Prevent auto-scroll on initial load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      const userMessage = message;
      setMessage('');
      setIsTyping(true);
      
      try {
        await sendMessage(userMessage);
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoleBasedWelcome = () => {
    switch (user?.role) {
      case 'admin':
        return "Hello! I'm your AI assistant. I can help you manage users, analyze system metrics, create admin tasks, and provide insights across your organization.";
      case 'team_leader':
        return "Hi there! I'm here to help you manage your team, assign tasks, track performance, and optimize your team's productivity.";
      default:
        return "Welcome! I'm your personal AI assistant. I can help you manage tasks, set priorities, track deadlines, and boost your productivity.";
    }
  };

  const getRoleBasedPrompts = () => {
    const basePrompts = [
      'What are my tasks for today?',
      'Create a task: Team meeting tomorrow at 2pm',
      'Show me my overdue tasks',
      'What should I prioritize today?',
    ];

    if (user?.role === 'admin') {
      return [
        ...basePrompts,
        'Show system performance metrics',
        'How many users are active this month?',
        'Create admin task: System maintenance',
      ];
    }

    if (user?.role === 'team_leader') {
      return [
        ...basePrompts,
        'How is my team performing?',
        'Assign task to team member',
        'Show team workload distribution',
      ];
    }

    return basePrompts;
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] space-x-6 animate-ultra-fade-in page-transition">
      {/* Enhanced Sidebar */}
      <div className="w-80 space-y-4">
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl ultra-hover animate-ultra-slide-up">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-600 animate-pulse" />
                <span>AI Assistant</span>
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={createNewConversation}
                className="ultra-hover hover:scale-105 transition-transform duration-300"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Smart task management assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ConversationHistory
              conversations={conversations}
              currentId={currentConversationId}
              onSwitch={switchConversation}
            />
          </CardContent>
        </Card>

        <SuggestedPrompts
          prompts={getRoleBasedPrompts()}
          onSelect={setMessage}
          userRole={user?.role}
        />

        {/* Enhanced AI Capabilities */}
        <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl ultra-hover animate-ultra-slide-up delay-200">
          <CardHeader>
            <CardTitle className="text-sm">AI Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-xs">
              <div className="flex items-start space-x-3">
                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="font-medium">Smart Task Creation</p>
                  <p className="text-gray-500 dark:text-gray-400">Extract tasks from natural language</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Target className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0 animate-pulse delay-200" />
                <div>
                  <p className="font-medium">Priority Analysis</p>
                  <p className="text-gray-500 dark:text-gray-400">Intelligent task prioritization</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Calendar className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0 animate-pulse delay-400" />
                <div>
                  <p className="font-medium">Schedule Management</p>
                  <p className="text-gray-500 dark:text-gray-400">Deadline tracking and reminders</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl ultra-hover animate-ultra-slide-up delay-300">
          <CardHeader className="border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-green-600 text-white">
                      <Bot className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">SmartTasker AI</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isTyping ? (
                      <span className="flex items-center">
                        <span className="animate-pulse">Thinking</span>
                        <span className="ml-1 animate-bounce">...</span>
                      </span>
                    ) : 'Online'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 animate-pulse">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </CardHeader>
          
          {/* Enhanced Messages Container */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50"
            style={{ scrollBehavior: 'smooth' }}
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center animate-ultra-fade-in">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mb-6 animate-gentle-glow">
                  <Bot className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 gradient-text">
                  Welcome to SmartTasker AI
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  {getRoleBasedWelcome()}
                </p>
              </div>
            )}
            
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                message={msg}
                user={user}
                onCreateTask={confirmTask}
              />
            ))}
            
            {isTyping && (
              <div className="flex items-center space-x-3 animate-ultra-fade-in">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-6 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* This div will be used for scrolling */}
            <div ref={messagesEndRef} className="h-2" />
          </div>
          
          {/* Enhanced Task Preview */}
          {taskPreview && (
            <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4 animate-ultra-slide-up">
              <TaskPreviewCard
                task={taskPreview}
                onConfirm={confirmTask}
                onCancel={clearTaskPreview}
              />
            </div>
          )}
          
          {/* Enhanced Message Input */}
          <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-4">
            <div className="flex space-x-3">
              <Input
                ref={inputRef}
                placeholder="Ask me anything or describe a task..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 transition-all duration-300 ultra-hover"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ultra-hover"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIChat;
