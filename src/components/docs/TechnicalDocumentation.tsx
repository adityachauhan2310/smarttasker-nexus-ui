
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Code, 
  Database, 
  Globe, 
  Shield, 
  Calendar,
  Users,
  Settings,
  Layout,
  Palette,
  Zap,
  Smartphone,
  Monitor
} from 'lucide-react';

const TechnicalDocumentation = () => {
  return (
    <div className="space-y-6 animate-ultra-fade-in">
      <div className="animate-ultra-slide-up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
          Technical Documentation
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Comprehensive documentation for the Task Management System
        </p>
      </div>

      <Tabs defaultValue="overview" className="animate-ultra-slide-up delay-200">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="ui-design">UI Design</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Project Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">System Description</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  A comprehensive task management system built with React, TypeScript, and modern web technologies. 
                  The system supports three distinct user roles with role-based access control and features 
                  advanced calendar management, team collaboration, and real-time updates.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">User Roles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Shield className="h-8 w-8 text-blue-600 mb-2" />
                    <h4 className="font-medium">Admin</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Full system access, user management, system monitoring, and administrative tasks.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Users className="h-8 w-8 text-green-600 mb-2" />
                    <h4 className="font-medium">Team Leader</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Team management, task assignment, progress tracking, and team calendar oversight.
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Calendar className="h-8 w-8 text-purple-600 mb-2" />
                    <h4 className="font-medium">Team Member</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Personal task management, calendar access, and team collaboration features.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Key Technologies</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">React 18</Badge>
                  <Badge variant="outline">TypeScript</Badge>
                  <Badge variant="outline">Vite</Badge>
                  <Badge variant="outline">Tailwind CSS</Badge>
                  <Badge variant="outline">Shadcn/ui</Badge>
                  <Badge variant="outline">React Router</Badge>
                  <Badge variant="outline">React Query</Badge>
                  <Badge variant="outline">Date-fns</Badge>
                  <Badge variant="outline">Lucide React</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="architecture" className="space-y-6">
          <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5 text-green-600" />
                <span>System Architecture</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Application Structure</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Frontend Architecture</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Component-based React architecture with TypeScript</li>
                      <li>• Modular design with reusable UI components</li>
                      <li>• Context-based state management for authentication and themes</li>
                      <li>• React Router for client-side routing</li>
                      <li>• Responsive design with Tailwind CSS</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Component Hierarchy</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• <code>/src/components/ui/</code> - Reusable UI components</li>
                      <li>• <code>/src/components/layout/</code> - Layout components (Header, Sidebar)</li>
                      <li>• <code>/src/components/modals/</code> - Modal dialogs and popups</li>
                      <li>• <code>/src/pages/</code> - Role-specific page components</li>
                      <li>• <code>/src/contexts/</code> - React context providers</li>
                      <li>• <code>/src/hooks/</code> - Custom React hooks</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Authentication & Authorization</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Role-based access control (RBAC)</li>
                      <li>• Protected routes with authentication guards</li>
                      <li>• Demo mode with predefined user roles</li>
                      <li>• Context-based user session management</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Calendar System</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Advanced Calendar Features</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Multi-view support (Month, Week, Day)</li>
                    <li>• Role-specific event management</li>
                    <li>• Event categorization and color coding</li>
                    <li>• Interactive date selection</li>
                    <li>• Real-time event updates</li>
                    <li>• Responsive calendar grid</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Event Management</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Add, edit, and delete events</li>
                    <li>• Event attendee management</li>
                    <li>• Priority and status indicators</li>
                    <li>• Recurring event support</li>
                    <li>• Event notifications</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span>Team Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">User Management</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Role-based user creation</li>
                    <li>• Team member assignment</li>
                    <li>• User profile management</li>
                    <li>• Activity tracking</li>
                    <li>• Performance metrics</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Task Assignment</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Task creation and assignment</li>
                    <li>• Progress tracking</li>
                    <li>• Deadline management</li>
                    <li>• Priority levels</li>
                    <li>• Status updates</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-purple-600" />
                  <span>Data Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">State Management</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• React Context for global state</li>
                    <li>• Local component state</li>
                    <li>• Form state management</li>
                    <li>• Caching strategies</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Data Flow</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Unidirectional data flow</li>
                    <li>• Event-driven updates</li>
                    <li>• Optimistic UI updates</li>
                    <li>• Error handling</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-orange-600" />
                  <span>System Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Admin Features</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• System monitoring dashboard</li>
                    <li>• User management interface</li>
                    <li>• Performance analytics</li>
                    <li>• System maintenance tools</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Integration Features</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Modal system for forms</li>
                    <li>• Notification center</li>
                    <li>• Search functionality</li>
                    <li>• Export capabilities</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ui-design" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5 text-blue-600" />
                  <span>Design System</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Color Palette</h4>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs">Primary</span>
                    </div>
                    <div className="h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs">Success</span>
                    </div>
                    <div className="h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs">Warning</span>
                    </div>
                    <div className="h-12 bg-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-xs">Error</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Typography</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• System font stack with fallbacks</li>
                    <li>• Responsive typography scales</li>
                    <li>• Semantic heading hierarchy</li>
                    <li>• Optimized readability</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Layout className="h-5 w-5 text-green-600" />
                  <span>Layout & Components</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Layout System</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Responsive grid system</li>
                    <li>• Flexible sidebar navigation</li>
                    <li>• Consistent spacing scale</li>
                    <li>• Mobile-first approach</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Component Library</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Shadcn/ui component base</li>
                    <li>• Custom calendar components</li>
                    <li>• Modal and dialog systems</li>
                    <li>• Form input components</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  <span>Animations & Interactions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Animation System</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• CSS-based animations with Tailwind</li>
                    <li>• Smooth page transitions</li>
                    <li>• Hover and focus states</li>
                    <li>• Loading animations</li>
                    <li>• Micro-interactions</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Interactive Elements</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Button hover effects</li>
                    <li>• Card animations</li>
                    <li>• Modal transitions</li>
                    <li>• Navigation animations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5 text-orange-600" />
                  <span>Responsive Design</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Breakpoint System</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Mobile: 320px - 768px</li>
                    <li>• Tablet: 768px - 1024px</li>
                    <li>• Desktop: 1024px+</li>
                    <li>• Large screens: 1440px+</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Adaptive Features</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Collapsible sidebar on mobile</li>
                    <li>• Responsive calendar views</li>
                    <li>• Touch-friendly interactions</li>
                    <li>• Optimized modal layouts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-6">
          <Card className="backdrop-blur-sm bg-white/95 dark:bg-gray-800/95 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-green-600" />
                <span>Deployment & Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Build Configuration</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Vite Build System</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Fast development server with HMR</li>
                      <li>• Optimized production builds</li>
                      <li>• Tree-shaking for smaller bundles</li>
                      <li>• Asset optimization</li>
                      <li>• TypeScript compilation</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Performance Optimizations</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Code splitting with React.lazy</li>
                      <li>• Image optimization</li>
                      <li>• CSS purging with Tailwind</li>
                      <li>• Minified JavaScript bundles</li>
                      <li>• Gzip compression ready</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Browser Support</h4>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Modern browsers (Chrome, Firefox, Safari, Edge)</li>
                      <li>• ES2020+ features</li>
                      <li>• CSS Grid and Flexbox</li>
                      <li>• Progressive enhancement</li>
                    </ul>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Development Setup</h4>
                    <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono">
                      <div># Install dependencies</div>
                      <div>npm install</div>
                      <div></div>
                      <div># Start development server</div>
                      <div>npm run dev</div>
                      <div></div>
                      <div># Build for production</div>
                      <div>npm run build</div>
                      <div></div>
                      <div># Preview production build</div>
                      <div>npm run preview</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TechnicalDocumentation;
