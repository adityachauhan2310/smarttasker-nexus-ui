
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Target, Calendar, BarChart3, Users, Settings } from 'lucide-react';

interface SuggestedPromptsProps {
  prompts: string[];
  onSelect: (prompt: string) => void;
  userRole?: string;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ prompts, onSelect, userRole }) => {
  const getIcon = (prompt: string) => {
    if (prompt.includes('task') || prompt.includes('create')) return Target;
    if (prompt.includes('today') || prompt.includes('calendar')) return Calendar;
    if (prompt.includes('metric') || prompt.includes('performance')) return BarChart3;
    if (prompt.includes('team') || prompt.includes('user')) return Users;
    if (prompt.includes('system') || prompt.includes('admin')) return Settings;
    return MessageSquare;
  };

  return (
    <Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-800/90 border-0 shadow-xl">
      <CardHeader>
        <CardTitle className="text-sm flex items-center space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span>Quick Questions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {prompts.map((prompt, index) => {
          const Icon = getIcon(prompt);
          return (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="w-full text-left justify-start text-xs h-auto py-3 px-3 hover:scale-105 transition-all hover:shadow-md"
              onClick={() => onSelect(prompt)}
            >
              <Icon className="h-3 w-3 mr-2 flex-shrink-0" />
              <span className="truncate">{prompt}</span>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default SuggestedPrompts;
