
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, Shield, Users, User, FileText, Eye, EyeOff } from 'lucide-react';
import { useToast } from "@/hooks/use-toast"

const SignIn = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isDemoModalOpen, setDemoModalOpen] = useState(false);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "Please fill in all fields.",
      })
      return;
    }

    // Simulate login process
    try {
      // Replace this with your actual authentication logic
      const user = await simulateAuthentication(email, password);

      if (user) {
        await login(email, password);
        navigate('/'); // Redirect to dashboard or home page
      } else {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: "Invalid credentials.",
        })
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message || "An error occurred during sign in.",
      })
    }
  };

  const openDemoModal = () => {
    setDemoModalOpen(true);
  };

  const closeDemoModal = () => {
    setDemoModalOpen(false);
  };

  const toggleDemoCredentials = () => {
    setShowDemoCredentials(!showDemoCredentials);
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@smarttasker.ai', password: 'password123' },
    { role: 'Team Leader', email: 'teamlead@smarttasker.ai', password: 'password123' },
    { role: 'Team Member', email: 'member@smarttasker.ai', password: 'password123' },
  ];

  return (
    <div className="grid h-screen place-items-center bg-gray-100 dark:bg-gray-900">
      <Card className="w-96 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <CardHeader className="space-y-1 p-6">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400 text-center">
            Enter your email and password to sign in
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold rounded-lg">
              Sign In
            </Button>
          </form>
          
          {/* Demo Credentials Toggle */}
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={toggleDemoCredentials}
              className="w-full mb-3"
            >
              {showDemoCredentials ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {showDemoCredentials ? 'Hide' : 'Show'} Demo Credentials
            </Button>
            
            {showDemoCredentials && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Demo Accounts:</h4>
                {demoCredentials.map((cred, index) => (
                  <div key={index} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border">
                    <div className="font-medium text-gray-800 dark:text-gray-200">{cred.role}</div>
                    <div className="text-gray-600 dark:text-gray-400">Email: {cred.email}</div>
                    <div className="text-gray-600 dark:text-gray-400">Password: {cred.password}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <Button variant="link" onClick={openDemoModal} className="w-full">
              Quick Demo Access
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/docs')}
              className="w-full"
            >
              <FileText className="mr-2 h-4 w-4" />
              View Documentation
            </Button>
          </div>
        </CardContent>
      </Card>

      <DemoModal isOpen={isDemoModalOpen} onClose={closeDemoModal} />
    </div>
  );
};

const DemoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { login } = useAuth();

  const handleDemoAccess = async (role: 'admin' | 'team_leader' | 'team_member') => {
    // Simulate login with demo credentials
    const demoEmail = `demo@${role}.com`;
    await login(demoEmail, 'password123');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Choose Demo Access</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select the type of access you'd like to demo:
        </p>
        
        <div className="space-y-3">
          <Button
            onClick={() => handleDemoAccess('admin')}
            className="w-full justify-start bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
          >
            <Shield className="mr-2 h-4 w-4" />
            Admin Access
            <span className="ml-auto text-xs opacity-75">Full system control</span>
          </Button>
          
          <Button
            onClick={() => handleDemoAccess('team_leader')}
            className="w-full justify-start bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
          >
            <Users className="mr-2 h-4 w-4" />
            Team Leader Access
            <span className="ml-auto text-xs opacity-75">Team management</span>
          </Button>
          
          <Button
            onClick={() => handleDemoAccess('team_member')}
            className="w-full justify-start bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
          >
            <User className="mr-2 h-4 w-4" />
            Team Member Access
            <span className="ml-auto text-xs opacity-75">Individual tasks</span>
          </Button>
        </div>
        
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full mt-4"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

// Simulate authentication function
const simulateAuthentication = async (email: string, password: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (email === 'test@example.com' && password === 'password') {
        resolve({
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'admin'
        });
      } else {
        reject(new Error('Invalid credentials'));
      }
    }, 500);
  });
};

export default SignIn;
