
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Sparkles, Bot, Zap } from 'lucide-react';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
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
    try {
      const user = await login(email, password);
      toast({
        title: 'Welcome back!',
        description: `Successfully signed in as ${user.name}`,
      });
      
      // Navigate based on role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'team_leader') {
        navigate('/team-leader/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast({
        title: 'Sign in failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/50 to-slate-900"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-green-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Brand */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Bot className="text-white font-bold text-2xl h-10 w-10" />
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="h-6 w-6 text-yellow-400 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-green-200 bg-clip-text text-transparent">
                SmartTasker AI
              </h1>
              <p className="text-gray-300 text-lg">Intelligent Task Management System</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span>Powered by Advanced AI</span>
                <Zap className="h-4 w-4 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* Demo Credentials */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-center text-blue-300 flex items-center justify-center space-x-2">
                <Sparkles className="h-4 w-4" />
                <span>Demo Credentials</span>
                <Sparkles className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-blue-500/20 backdrop-blur-sm rounded-lg border border-blue-400/30 hover:bg-blue-500/30 transition-all cursor-pointer" 
                     onClick={() => { setEmail('admin@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between">
                    <strong className="text-blue-200">Admin Access</strong>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-blue-300 mt-1">admin@smarttasker.ai / password123</div>
                </div>
                <div className="p-3 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-400/30 hover:bg-green-500/30 transition-all cursor-pointer"
                     onClick={() => { setEmail('teamlead@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between">
                    <strong className="text-green-200">Team Leader</strong>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-green-300 mt-1">teamlead@smarttasker.ai / password123</div>
                </div>
                <div className="p-3 bg-purple-500/20 backdrop-blur-sm rounded-lg border border-purple-400/30 hover:bg-purple-500/30 transition-all cursor-pointer"
                     onClick={() => { setEmail('member@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between">
                    <strong className="text-purple-200">Team Member</strong>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-purple-300 mt-1">member@smarttasker.ai / password123</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sign In Form */}
          <Card className="backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-white">Sign in</CardTitle>
              <CardDescription className="text-center text-gray-300">
                Enter your credentials to access your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200">Email</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/50 transition-all ${errors.email ? 'border-red-400' : ''}`}
                      disabled={loading}
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-400 animate-fade-in">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/50 transition-all pr-10 ${errors.password ? 'border-red-400' : ''}`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-400 animate-fade-in">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full relative group bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white font-semibold py-3 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  disabled={loading}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-300"></div>
                  <div className="relative flex items-center justify-center">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Sign in to SmartTasker
                      </>
                    )}
                  </div>
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center text-gray-400 text-sm animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <p>Experience the future of task management</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
