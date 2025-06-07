import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  EyeOff, 
  Loader2, 
  Bot, 
  Zap, 
  Code,
  Rocket,
  Brain,
  Shield,
  Database
} from 'lucide-react';
import TechnicalDocumentation from '../components/docs/TechnicalDocumentation';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; server?: string }>({});
  const [showTechDocs, setShowTechDocs] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const user = await login(email, password);
      toast({
        title: 'Welcome back!',
        description: `Successfully signed in as ${user.name}`,
      });
      
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'team_leader') {
        navigate('/team-leader/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      const errorMsg = error instanceof Error ? error.message : 'An error occurred';
      
      toast({
        title: 'Sign in failed',
        description: errorMsg,
        variant: 'destructive',
      });
      
      // Check for specific error types and set appropriate error messages
      if (errorMsg.includes('network') || errorMsg.includes('connect to server')) {
        setErrors({
          server: 'Server connection error. Please check your network and server status.'
        });
      } else if (errorMsg.includes('Invalid email or password')) {
        setErrors({
          password: 'Invalid email or password. Please try again.'
        });
      } else if (errorMsg.includes('Too many login attempts')) {
        setErrors({
          server: 'Too many login attempts. Please try again later.'
        });
      } else {
        setErrors({
          server: errorMsg
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-gradient-to-br from-slate-950 via-blue-950/90 to-purple-950/90">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] opacity-40"></div>
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse duration-4000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse duration-6000 delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-green-400/10 rounded-full blur-3xl animate-pulse duration-5000 delay-2000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4 gap-8">
        <div className="w-full max-w-7xl flex flex-col items-center justify-center gap-8">
          {/* Left Side - Branding */}
          <div className="w-full max-w-lg space-y-6 text-center">
            <div className="group flex justify-center">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-700"></div>
                <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-500">
                  <Bot className="text-white h-8 w-8" />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
                SmartTasker AI
              </h1>
              <p className="text-lg text-gray-300 font-light">
                Intelligent Task Management Platform
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-white">AI Powered</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-white">Secure</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-2 border border-white/20 hover:bg-white/20 transition-all duration-300">
                <Rocket className="h-4 w-4 text-purple-400" />
                <span className="text-white">Enterprise</span>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                variant="outline"
                onClick={() => setShowTechDocs(true)}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-105"
              >
                <Code className="h-4 w-4 mr-2" />
                Technical Documentation
              </Button>
            </div>
          </div>

          {/* Right Side - Authentication */}
          <div className="w-full max-w-md space-y-6 mx-auto">
            {/* Sign In Form */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 rounded-2xl">
              <CardHeader className="space-y-1 pb-4">
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 flex items-center justify-center shadow-lg">
                    <Bot className="text-white h-7 w-7" />
                  </div>
                </div>
                <CardTitle className="text-xl text-center text-white flex items-center justify-center space-x-2">
                  <Database className="h-5 w-5 text-blue-400" />
                  <span>Welcome Back</span>
                </CardTitle>
                <CardDescription className="text-center text-gray-300">
                  Sign in to access your workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-200">Email</Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/30 transition-all duration-300 backdrop-blur-sm hover:bg-white/15 ${errors.email ? 'border-red-400' : ''}`}
                        disabled={loading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-400 flex items-center space-x-1 animate-in fade-in duration-200">
                        <span>⚠</span>
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-200">Password</Label>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/30 transition-all duration-300 pr-10 backdrop-blur-sm hover:bg-white/15 ${errors.password ? 'border-red-400' : ''}`}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-400 flex items-center space-x-1 animate-in fade-in duration-200">
                        <span>⚠</span>
                        <span>{errors.password}</span>
                      </p>
                    )}
                  </div>

                  {/* Display server-side errors */}
                  {errors.server && (
                    <div className="bg-red-500/20 text-red-200 px-3 py-2 rounded-md text-sm">
                      <p className="flex items-center space-x-2 animate-in fade-in duration-300">
                        <span>⚠</span>
                        <span>{errors.server}</span>
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 hover:from-indigo-600 hover:via-purple-600 hover:to-blue-600 text-white font-medium py-2 shadow-md rounded-lg transition-all duration-300"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            {/* Footer */}
            <div className="text-center text-gray-400 text-sm">
              <p className="flex items-center justify-center space-x-2">
                <Brain className="h-4 w-4 text-purple-400" />
                <span>Experience the future of task management</span>
                <Brain className="h-4 w-4 text-purple-400" />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Documentation Modal */}
      <TechnicalDocumentation 
        isOpen={showTechDocs} 
        onClose={() => setShowTechDocs(false)} 
      />
    </div>
  );
};

export default SignIn;
