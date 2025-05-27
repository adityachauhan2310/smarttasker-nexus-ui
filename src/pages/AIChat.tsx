
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send, Bot, User, Sparkles, Clock } from 'lucide-react';

const AIChat = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI assistant. I can help you with task management, productivity tips, project planning, and much more. What would you like to know?',
      timestamp: '10:00 AM',
    },
    {
      id: '2',
      type: 'user',
      content: 'Can you help me prioritize my tasks for today?',
      timestamp: '10:01 AM',
    },
    {
      id: '3',
      type: 'ai',
      content: 'Absolutely! I can help you prioritize your tasks. Based on your current workload, I recommend focusing on high-priority items with upcoming deadlines first. Would you like me to analyze your current task list and suggest a prioritized schedule?',
      timestamp: '10:01 AM',
    },
  ]);

  const suggestedQuestions = [
    'How can I improve my productivity?',
    'What are my upcoming deadlines?',
    'Help me plan my sprint',
    'Analyze my team\'s performance',
    'Suggest task automation ideas',
  ];

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        type: 'user' as const,
        content: message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setMessages([...messages, newMessage]);
      setMessage('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai' as const,
          content: 'Thank you for your question! I\'m processing your request and will provide you with a detailed response. As an AI assistant, I can help you with various aspects of task management and productivity.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Get help with task management, productivity tips, and project planning
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-blue-600" />
                <span>SmartTasker AI Assistant</span>
                <Badge variant="secondary" className="ml-auto">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </CardTitle>
              <CardDescription>
                Your intelligent assistant for productivity and task management
              </CardDescription>
            </CardHeader>
            
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex space-x-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'ai' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-600 text-white">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Clock className="h-3 w-3 opacity-50" />
                      <span className="text-xs opacity-75">{msg.timestamp}</span>
                    </div>
                  </div>
                  
                  {msg.type === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-600 text-white">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </CardContent>
            
            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!message.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Questions</CardTitle>
              <CardDescription className="text-xs">
                Click to ask common questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-left justify-start text-xs h-auto py-2 px-3"
                  onClick={() => handleSuggestedQuestion(question)}
                >
                  <MessageSquare className="h-3 w-3 mr-2 flex-shrink-0" />
                  <span className="truncate">{question}</span>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* AI Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-2">
                  <Sparkles className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Task Analysis</p>
                    <p className="text-gray-500">Analyze and prioritize your tasks</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Sparkles className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Productivity Tips</p>
                    <p className="text-gray-500">Get personalized productivity advice</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Sparkles className="h-3 w-3 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Team Insights</p>
                    <p className="text-gray-500">Understand team performance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Sparkles className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Planning Support</p>
                    <p className="text-gray-500">Help with project planning</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Assistant Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge variant="secondary" className="text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Online
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Response Time</span>
                  <span className="text-gray-500">~1 second</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated</span>
                  <span className="text-gray-500">Just now</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
