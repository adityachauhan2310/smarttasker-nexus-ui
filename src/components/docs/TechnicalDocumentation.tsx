
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Code, 
  Database, 
  Shield, 
  Layers, 
  Zap, 
  Download,
  Copy,
  CheckCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TechnicalDocumentationProps {
  isOpen: boolean;
  onClose: () => void;
}

const TechnicalDocumentation: React.FC<TechnicalDocumentationProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const frontendTechStack = `
# SmartTasker AI - Frontend Technology Stack

## Core Framework & Build Tools
- **React 18.3.1** - Modern React with Hooks and Concurrent Features
- **TypeScript** - Type-safe development with strict mode
- **Vite** - Fast build tool with HMR and optimized bundling
- **React Router DOM 6.26.2** - Client-side routing with nested routes

## UI Framework & Styling
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Shadcn/UI Components** - High-quality, accessible component library
- **Radix UI Primitives** - Unstyled, accessible UI primitives
- **Lucide React** - Beautiful icon library with 1000+ icons
- **Class Variance Authority** - Type-safe variant handling

## State Management & Data Fetching
- **TanStack React Query 5.56.2** - Server state management with caching
- **React Context API** - Global state for auth, theme, notifications
- **Custom Hooks** - Reusable stateful logic

## Authentication & Security (Current Frontend Implementation)
- **Role-based Access Control** - Admin, Team Leader, Team Member roles
- **Protected Routes** - Route-level authentication guards
- **Session Management** - Context-based user state
- **Mock Authentication** - Demo credentials for testing

## Form Handling & Validation
- **React Hook Form 7.53.0** - Performant forms with minimal re-renders
- **Zod 3.23.8** - Schema validation with TypeScript inference
- **Hookform Resolvers** - Integration between RHF and Zod

## Date & Time Management
- **Date-fns 3.6.0** - Modern date utility library
- **React Day Picker** - Flexible date picker component

## UI Enhancements
- **Framer Motion** (via Tailwind animations) - Smooth animations
- **Sonner** - Toast notifications
- **Next Themes** - Dark mode support
- **Embla Carousel** - Touch-friendly carousels

## Development & Code Quality
- **ESLint** - Code linting with React best practices
- **TypeScript Strict Mode** - Enhanced type checking
- **Vite Hot Reload** - Instant development feedback
`;

  const backendRequirements = `
# SmartTasker AI - Backend Requirements & API Specifications

## Recommended Technology Stack
- **Node.js 18+** with **Express.js** or **Fastify**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **Redis** for session storage and caching
- **JWT** for authentication with refresh tokens

## Data Models & Schemas

### User Model
\`\`\`typescript
interface User {
  id: string;
  email: string;
  password: string; // bcrypt hashed
  name: string;
  role: 'admin' | 'team_leader' | 'team_member';
  avatar?: string;
  teamId?: string;
  isActive: boolean;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    deadlineReminders: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}
\`\`\`

### Task Model
\`\`\`typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: Date;
  createdBy: string; // User ID
  assignedTo: string; // User ID
  tags: string[];
  comments: Comment[];
  attachments: Attachment[];
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

### Team Model
\`\`\`typescript
interface Team {
  id: string;
  name: string;
  description: string;
  leaderId: string; // User ID
  memberIds: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

## API Endpoints Required

### Authentication
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh
- GET /api/auth/me

### Users (Admin only)
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

### Tasks
- GET /api/tasks (with filtering, pagination)
- POST /api/tasks
- PUT /api/tasks/:id
- DELETE /api/tasks/:id
- PATCH /api/tasks/:id/status
- GET /api/tasks/dashboard-stats

### Teams (Admin & Team Leaders)
- GET /api/teams
- POST /api/teams (Admin only)
- PUT /api/teams/:id
- POST /api/teams/:id/members
- DELETE /api/teams/:id/members/:userId

## Security Requirements
- **CORS** configuration for frontend domain
- **Rate limiting** (100 requests/minute per IP)
- **Helmet.js** for security headers
- **Input validation** with Joi or Zod
- **MongoDB injection** prevention
- **XSS protection**

## Database Indexes
\`\`\`javascript
// Tasks collection
db.tasks.createIndex({ assignedTo: 1, dueDate: 1 });
db.tasks.createIndex({ createdBy: 1, status: 1 });
db.tasks.createIndex({ dueDate: 1, status: 1 });

// Users collection  
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ teamId: 1 });
\`\`\`
`;

  const integrationGuide = `
# Frontend-Backend Integration Guide

## API Configuration
The frontend expects the backend to run on:
- **Development**: http://localhost:5000
- **Production**: Your deployed backend URL

## Authentication Flow
1. User submits login form
2. Frontend sends POST to /api/auth/login
3. Backend validates credentials and returns JWT + refresh token
4. Frontend stores tokens and redirects based on user role
5. Protected routes include Authorization header: "Bearer {token}"

## Expected API Response Formats

### Authentication Response
\`\`\`json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com", 
      "name": "User Name",
      "role": "team_member",
      "avatar": "avatar_url"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
\`\`\`

### Task List Response
\`\`\`json
{
  "success": true,
  "data": {
    "tasks": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47
    }
  }
}
\`\`\`

### Error Response Format
\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {...}
  }
}
\`\`\`

## Role-Based Permissions
- **admin**: Full system access
- **team_leader**: Team management + task assignment
- **team_member**: Own tasks + assigned tasks

## Real-time Features (Optional)
Consider WebSocket integration for:
- Task assignment notifications
- Real-time collaboration
- Live dashboard updates
`;

  const deploymentGuide = `
# Deployment & Environment Setup

## Environment Variables (.env)
\`\`\`
# Database
MONGODB_URI=mongodb://localhost:27017/smarttasker
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# File Upload (if needed)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_BUCKET_NAME=smarttasker-uploads
\`\`\`

## Docker Setup
\`\`\`dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
\`\`\`

## Production Checklist
- [ ] Set up MongoDB with replica set
- [ ] Configure Redis for sessions
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring (PM2, DataDog)
- [ ] Configure log rotation
- [ ] Set up automated backups
- [ ] Security audit and penetration testing
`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
                <Code className="h-6 w-6 text-blue-600" />
                <span>SmartTasker AI - Technical Documentation</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-2">
                Complete technical specifications for backend development team
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 p-6">
          <Tabs defaultValue="frontend" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="frontend" className="flex items-center space-x-2">
                <Layers className="h-4 w-4" />
                <span>Frontend Stack</span>
              </TabsTrigger>
              <TabsTrigger value="backend" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Backend Requirements</span>
              </TabsTrigger>
              <TabsTrigger value="integration" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Integration</span>
              </TabsTrigger>
              <TabsTrigger value="deployment" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Deployment</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="frontend" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Frontend Technology Stack</CardTitle>
                    <CardDescription>Current implementation details and dependencies</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(frontendTechStack, 'frontend')}
                  >
                    {copiedSection === 'frontend' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                      {frontendTechStack}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backend" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Backend Requirements & API Specs</CardTitle>
                    <CardDescription>Data models, endpoints, and security requirements</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(backendRequirements, 'backend')}
                  >
                    {copiedSection === 'backend' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                      {backendRequirements}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Integration Guide</CardTitle>
                    <CardDescription>How to connect frontend with backend services</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(integrationGuide, 'integration')}
                  >
                    {copiedSection === 'integration' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                      {integrationGuide}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deployment" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Deployment & Environment Setup</CardTitle>
                    <CardDescription>Production deployment guidelines and environment configuration</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(deploymentGuide, 'deployment')}
                  >
                    {copiedSection === 'deployment' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                      {deploymentGuide}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-6 border-t">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Zap className="h-3 w-3 mr-1" />
                Ready for Backend Development
              </Badge>
              <Badge variant="outline">
                Version 1.0
              </Badge>
            </div>
            <Button 
              className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              onClick={() => {
                const fullDoc = frontendTechStack + '\n\n' + backendRequirements + '\n\n' + integrationGuide + '\n\n' + deploymentGuide;
                const blob = new Blob([fullDoc], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'smarttasker-ai-technical-docs.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Complete Documentation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TechnicalDocumentation;
