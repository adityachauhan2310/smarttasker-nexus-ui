
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
  Sparkles, 
  Bot, 
  Zap, 
  Code,
  Rocket,
  Brain,
  Shield,
  Database,
  Layers,
  Users
} from 'lucide-react';
import TechnicalDocumentation from '../components/docs/TechnicalDocumentation';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
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
    <div className="min-h-screen w-full overflow-auto relative bg-slate-950">
      {/* Animated Background - Fixed position for proper scrolling */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/50 to-purple-900/50"></div>
        
        {/* Animated orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse duration-[4s]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse duration-[6s] delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-green-400/15 rounded-full blur-3xl animate-pulse duration-[5s] delay-2000"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30"></div>
      </div>

      {/* Scrollable content container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center my-8">
          
          {/* Left Side - Branding */}
          <div className="space-y-4 lg:space-y-6 text-center lg:text-left order-2 lg:order-1">
            {/* Logo */}
            <div className="group flex justify-center lg:justify-start">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-all duration-700"></div>
                <div className="relative w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-2xl flex items-center justify-center transform group-hover:scale-110 transition-all duration-500">
                  <Bot className="text-white h-6 w-6 lg:h-8 lg:w-8" />
                </div>
              </div>
            </div>
            
            {/* Title */}
            <div className="space-y-2 lg:space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
                SmartTasker AI
              </h1>
              <p className="text-lg lg:text-xl text-gray-300 font-light">
                Intelligent Task Management Platform
              </p>
            </div>
            
            {/* Features */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 text-sm">
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

            {/* Tech Docs Button */}
            <div className="pt-2 lg:pt-4">
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
          <div className="space-y-4 lg:space-y-6 order-1 lg:order-2 w-full max-w-md mx-auto lg:max-w-none">
            
            {/* Demo Credentials */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-center text-blue-300 flex items-center justify-center space-x-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Demo Credentials</span>
                  <Sparkles className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid gap-2">
                  <div 
                    className="p-2 lg:p-3 bg-gradient-to-r from-blue-500/20 to-blue-600/10 backdrop-blur-sm rounded-lg border border-blue-400/30 hover:from-blue-500/30 hover:to-blue-600/20 transition-all duration-300 cursor-pointer group" 
                    onClick={() => { setEmail('admin@smarttasker.ai'); setPassword('password123'); }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-blue-300" />
                        <span className="text-blue-200 text-sm font-medium">Admin</span>
                      </div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="text-blue-300 font-mono text-xs mt-1">admin@smarttasker.ai</div>
                  </div>
                  
                  <div 
                    className="p-2 lg:p-3 bg-gradient-to-r from-green-500/20 to-green-600/10 backdrop-blur-sm rounded-lg border border-green-400/30 hover:from-green-500/30 hover:to-green-600/20 transition-all duration-300 cursor-pointer group"
                    onClick={() => { setEmail('teamlead@smarttasker.ai'); setPassword('password123'); }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-green-300" />
                        <span className="text-green-200 text-sm font-medium">Team Leader</span>
                      </div>
                      <div className="w-2 h-2 bg-green-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="text-green-300 font-mono text-xs mt-1">teamlead@smarttasker.ai</div>
                  </div>
                  
                  <div 
                    className="p-2 lg:p-3 bg-gradient-to-r from-purple-500/20 to-purple-600/10 backdrop-blur-sm rounded-lg border border-purple-400/30 hover:from-purple-500/30 hover:to-purple-600/20 transition-all duration-300 cursor-pointer group"
                    onClick={() => { setEmail('member@smarttasker.ai'); setPassword('password123'); }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-purple-300" />
                        <span className="text-purple-200 text-sm font-medium">Team Member</span>
                      </div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full opacity-70 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="text-purple-300 font-mono text-xs mt-1">member@smarttasker.ai</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sign In Form */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
              <CardHeader className="space-y-1 pb-4">
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

                  <Button
                    type="submit"
                    className="w-full relative group bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white font-semibold py-3 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl border-0"
                    disabled={loading}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                    <div className="relative flex items-center justify-center">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <Rocket className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                          <span>Launch SmartTasker AI</span>
                        </>
                      )}
                    </div>
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
