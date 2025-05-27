
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X, 
  Code, 
  Database, 
  Server, 
  Shield, 
  Zap, 
  Palette,
  Monitor,
  Users,
  Brain,
  Calendar,
  MessageSquare,
  Settings,
  BarChart3,
  Download
} from 'lucide-react';

interface TechnicalDocumentationProps {
  isOpen: boolean;
  onClose: () => void;
}

const TechnicalDocumentation: React.FC<TechnicalDocumentationProps> = ({ isOpen, onClose }) => {
  const downloadDocumentation = () => {
    const content = `
# SmartTasker AI - Technical Documentation

## Frontend Architecture

### Core Technologies
- **React 18.3.1** - Modern React with Hooks and Concurrent Features
- **TypeScript** - Full type safety and enhanced developer experience
- **Vite** - Ultra-fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with custom animations
- **Shadcn/UI** - High-quality, accessible component library

### Key Features & Enhancements

#### Visual & Animation System
- **Ultra-smooth transitions** - Custom cubic-bezier animations (0.4, 0, 0.2, 1)
- **Enhanced calendar visuals** - Professional styling with smooth interactions
- **Gradient animations** - Dynamic background flows and text effects
- **Micro-interactions** - Hover effects, floating elements, and gentle glows
- **Responsive design** - Mobile-first approach with fluid layouts

#### AI Chat System
- **Groq AI Integration** - Fast, intelligent task processing
- **Smart scrolling** - Optimized message container with smooth navigation
- **Context awareness** - Role-based prompts and responses
- **Task preview** - Interactive task creation with confirmation
- **Conversation history** - Persistent chat sessions

#### Calendar Integration
- **Multi-role support** - Admin, Team Leader, and Member views
- **Real-time sync** - Task integration with calendar events
- **Enhanced styling** - Professional calendar component with animations
- **View modes** - Day, Week, Month perspectives
- **Event management** - Full CRUD operations for calendar events

#### Authentication & Authorization
- **Role-based access** - Admin, Team Leader, Team Member roles
- **JWT tokens** - Secure authentication with refresh rotation
- **Protected routes** - Route guards based on user permissions
- **Session management** - Persistent login state

### Component Architecture

#### Pages
- **SignIn** - Enhanced with stunning visuals and smooth animations
- **Dashboard** - Role-specific dashboards with real-time data
- **Calendar** - Multi-view calendar with task integration
- **AIChat** - Intelligent chat interface with optimized scrolling
- **TaskManagement** - CRUD operations for tasks

#### UI Components
- **Enhanced Calendar** - Custom styling with professional appearance
- **TaskCard** - Interactive task display with status indicators
- **MessageBubble** - AI chat message rendering
- **NotificationCenter** - Real-time notification system

### Styling & Animations

#### CSS Enhancements
- **Ultra-smooth animations** - Advanced keyframes with blur effects
- **Gradient flows** - Dynamic background animations
- **Enhanced hover effects** - Lift animations with proper shadows
- **Loading states** - Shimmer effects and skeleton screens
- **Scrollbar styling** - Custom scrollbars with gradients

#### Animation System
- **Stagger animations** - Sequential element animations
- **Floating elements** - Gentle floating animations
- **Gradient shifts** - Color flow animations
- **Scale transitions** - Smooth element scaling
- **Fade effects** - Advanced opacity transitions

### Performance Optimizations
- **Code splitting** - Dynamic imports for route-based chunks
- **Lazy loading** - Deferred component loading
- **Memoization** - React.memo for expensive components
- **Optimized scrolling** - Smooth scroll behavior in chat
- **Efficient re-renders** - Minimal component updates

## Backend Integration Requirements

### Data Models

#### User Model
\`\`\`typescript
interface User {
  id: string;
  email: string;
  password: string; // bcrypt hashed
  name: string;
  role: 'admin' | 'team_leader' | 'team_member';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}
\`\`\`

#### Task Model
\`\`\`typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  createdBy: string; // User ID
  assignedTo?: string; // User ID
  tags: string[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

#### Team Model
\`\`\`typescript
interface Team {
  id: string;
  name: string;
  description: string;
  leader: string; // User ID
  members: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

### API Endpoints

#### Authentication
- POST /auth/login
- POST /auth/logout
- POST /auth/refresh
- GET /auth/me

#### Tasks
- GET /tasks
- POST /tasks
- PUT /tasks/:id
- DELETE /tasks/:id
- GET /tasks/calendar

#### Users
- GET /users
- POST /users
- PUT /users/:id
- DELETE /users/:id

#### Teams
- GET /teams
- POST /teams
- PUT /teams/:id
- DELETE /teams/:id

### Security Requirements
- JWT authentication with refresh tokens
- BCRYPT password hashing
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

### Database Schema (MongoDB)
- Users collection with indexes on email
- Tasks collection with indexes on assignedTo, status, dueDate
- Teams collection with indexes on leader, members
- Notifications collection with indexes on user, read status

### Real-time Features
- WebSocket for live notifications
- Task updates broadcasting
- Calendar event synchronization
- Chat message streaming

## Deployment Architecture

### Frontend Deployment
- **Build**: \`npm run build\`
- **Preview**: \`npm run preview\`
- **Static hosting**: Compatible with Vercel, Netlify, AWS S3

### Environment Variables
\`\`\`
VITE_API_URL=https://api.smarttasker.ai
VITE_GROQ_API_KEY=your_groq_api_key
VITE_ENVIRONMENT=production
\`\`\`

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Generated on: ${new Date().toISOString()}
    `;

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smarttasker-ai-technical-docs.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 backdrop-blur-xl bg-white/95 dark:bg-gray-900/95 border-0 shadow-2xl animate-ultra-scale-in">
        <DialogHeader className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <Code className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold gradient-text">
                  SmartTasker AI - Technical Documentation
                </DialogTitle>
                <DialogDescription className="text-gray-600 dark:text-gray-400">
                  Complete technical specification and implementation guide
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={downloadDocumentation}
                variant="outline" 
                size="sm"
                className="ultra-hover"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                onClick={onClose} 
                variant="ghost" 
                size="sm"
                className="ultra-hover"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="frontend" className="h-full flex flex-col">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-5 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
                <TabsTrigger value="frontend" className="flex items-center space-x-2 ultra-hover">
                  <Monitor className="h-4 w-4" />
                  <span>Frontend</span>
                </TabsTrigger>
                <TabsTrigger value="backend" className="flex items-center space-x-2 ultra-hover">
                  <Server className="h-4 w-4" />
                  <span>Backend</span>
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center space-x-2 ultra-hover">
                  <Brain className="h-4 w-4" />
                  <span>Features</span>
                </TabsTrigger>
                <TabsTrigger value="deployment" className="flex items-center space-x-2 ultra-hover">
                  <Zap className="h-4 w-4" />
                  <span>Deployment</span>
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center space-x-2 ultra-hover">
                  <Database className="h-4 w-4" />
                  <span>API</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden px-6 pb-6">
              <TabsContent value="frontend" className="h-full animate-ultra-fade-in">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Core Technologies */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center space-x-2 text-gray-900 dark:text-white">
                          <Code className="h-5 w-5 text-blue-600" />
                          <span>Core Technologies</span>
                        </h3>
                        <div className="space-y-3">
                          <div className="p-4 border rounded-lg ultra-hover">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">React 18.3.1</h4>
                              <Badge variant="secondary">Frontend</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Modern React with Hooks, Concurrent Features, and Suspense
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg ultra-hover">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">TypeScript</h4>
                              <Badge variant="secondary">Language</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Full type safety and enhanced developer experience
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg ultra-hover">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Vite</h4>
                              <Badge variant="secondary">Build Tool</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Ultra-fast build tool and development server
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* UI Framework */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center space-x-2 text-gray-900 dark:text-white">
                          <Palette className="h-5 w-5 text-purple-600" />
                          <span>UI Framework</span>
                        </h3>
                        <div className="space-y-3">
                          <div className="p-4 border rounded-lg ultra-hover">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Tailwind CSS</h4>
                              <Badge variant="outline">Styling</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Utility-first CSS with custom animations and ultra-smooth transitions
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg ultra-hover">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Shadcn/UI</h4>
                              <Badge variant="outline">Components</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              High-quality, accessible component library with enhanced styling
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg ultra-hover">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Lucide React</h4>
                              <Badge variant="outline">Icons</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Beautiful icon library with consistent design
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Animation System */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2 text-gray-900 dark:text-white">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <span>Enhanced Animation System</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg ultra-hover">
                          <h4 className="font-medium mb-2">Ultra-Smooth Transitions</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Custom cubic-bezier animations (0.4, 0, 0.2, 1) for buttery-smooth effects
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg ultra-hover">
                          <h4 className="font-medium mb-2">Gradient Animations</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Dynamic gradient flows, text shimmer effects, and color transitions
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg ultra-hover">
                          <h4 className="font-medium mb-2">Micro-interactions</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Hover effects, floating elements, gentle glows, and scale transitions
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Component Architecture */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2 text-gray-900 dark:text-white">
                        <Settings className="h-5 w-5 text-gray-600" />
                        <span>Component Architecture</span>
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">Pages</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">SignIn (Enhanced)</Badge>
                            <Badge variant="outline">Dashboard</Badge>
                            <Badge variant="outline">Calendar (Multi-role)</Badge>
                            <Badge variant="outline">AIChat (Optimized)</Badge>
                            <Badge variant="outline">TaskManagement</Badge>
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-2">UI Components</h4>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary">Enhanced Calendar</Badge>
                            <Badge variant="secondary">TaskCard</Badge>
                            <Badge variant="secondary">MessageBubble</Badge>
                            <Badge variant="secondary">NotificationCenter</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="backend" className="h-full animate-ultra-fade-in">
                {/* ... rest of existing backend content ... */}
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                      <h3 className="font-semibold mb-2 flex items-center space-x-2">
                        <Database className="h-5 w-5 text-yellow-600" />
                        <span>Backend Requirements</span>
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        The backend needs to be implemented to support the enhanced frontend features.
                      </p>
                    </div>
                    {/* Add more backend documentation here */}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="features" className="h-full animate-ultra-fade-in">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center space-x-2 text-gray-900 dark:text-white">
                          <Brain className="h-5 w-5 text-blue-600" />
                          <span>AI Features</span>
                        </h3>
                        <div className="space-y-3">
                          <div className="p-4 border rounded-lg ultra-hover">
                            <h4 className="font-medium mb-2">Smart Chat Assistant</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              AI-powered task management with context awareness and smooth scrolling
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg ultra-hover">
                            <h4 className="font-medium mb-2">Intelligent Task Creation</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Extract tasks from natural language with priority analysis
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center space-x-2 text-gray-900 dark:text-white">
                          <Calendar className="h-5 w-5 text-green-600" />
                          <span>Calendar Integration</span>
                        </h3>
                        <div className="space-y-3">
                          <div className="p-4 border rounded-lg ultra-hover">
                            <h4 className="font-medium mb-2">Multi-Role Support</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Admin, Team Leader, and Member specific calendar views
                            </p>
                          </div>
                          <div className="p-4 border rounded-lg ultra-hover">
                            <h4 className="font-medium mb-2">Enhanced Visuals</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Professional styling with smooth animations and interactions
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="deployment" className="h-full animate-ultra-fade-in">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-4">Build Commands</h3>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 font-mono text-sm">
                        <div>npm run build</div>
                        <div>npm run preview</div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-4">Environment Variables</h3>
                      <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 font-mono text-sm">
                        <div>VITE_API_URL=https://api.smarttasker.ai</div>
                        <div>VITE_GROQ_API_KEY=your_groq_api_key</div>
                        <div>VITE_ENVIRONMENT=production</div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="api" className="h-full animate-ultra-fade-in">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-4">API Endpoints</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">POST</Badge>
                          <code>/auth/login</code>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">GET</Badge>
                          <code>/tasks</code>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">POST</Badge>
                          <code>/tasks</code>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">GET</Badge>
                          <code>/calendar/events</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TechnicalDocumentation;
