

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Ultra-Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/25 to-green-600/30 animate-gradient-flow"></div>
        
        {/* Enhanced floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-blue-500/15 rounded-full blur-2xl animate-floating" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-56 h-56 bg-green-500/15 rounded-full blur-2xl animate-floating" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl animate-floating" style={{ animationDelay: '4s', animationDuration: '12s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-44 h-44 bg-yellow-500/15 rounded-full blur-2xl animate-floating" style={{ animationDelay: '6s', animationDuration: '9s' }}></div>
        
        {/* Enhanced moving gradient lines */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/60 to-transparent top-1/4 animate-pulse"></div>
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/60 to-transparent top-1/2 animate-pulse delay-1000"></div>
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-green-500/60 to-transparent top-3/4 animate-pulse delay-2000"></div>
        </div>
        
        {/* Enhanced grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:120px_120px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] animate-pulse" style={{ animationDuration: '6s' }}></div>
        
        {/* Enhanced floating particles */}
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-white/25 rounded-full animate-floating"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${4 + Math.random() * 6}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Ultra-Enhanced Logo and Brand */}
          <div className="text-center space-y-6 animate-ultra-fade-in">
            <div className="relative group ultra-hover">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-all duration-700 animate-gentle-glow"></div>
              <div className="relative mx-auto w-28 h-28 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-500 animate-gradient-flow">
                <Bot className="text-white font-bold text-4xl h-14 w-14" />
                <div className="absolute -top-3 -right-3 animate-floating" style={{ animationDuration: '4s' }}>
                  <Sparkles className="h-10 w-10 text-yellow-400" />
                </div>
                <div className="absolute -bottom-2 -left-2 animate-floating" style={{ animationDelay: '2s' }}>
                  <Brain className="h-7 w-7 text-cyan-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-6xl font-bold gradient-text animate-gradient-flow">
                SmartTasker AI
              </h1>
              <p className="text-gray-300 text-2xl font-medium animate-ultra-slide-up delay-200">Intelligent Task Management System</p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-400 animate-ultra-slide-up delay-300">
                <div className="flex items-center space-x-2 ultra-hover">
                  <Zap className="h-5 w-5 text-yellow-400 animate-pulse" />
                  <span>AI Powered</span>
                </div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="flex items-center space-x-2 ultra-hover">
                  <Shield className="h-5 w-5 text-green-400 animate-pulse delay-300" />
                  <span>Secure</span>
                </div>
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                <div className="flex items-center space-x-2 ultra-hover">
                  <Rocket className="h-5 w-5 text-purple-400 animate-pulse delay-500" />
                  <span>Fast</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Documentation Button */}
          <div className="text-center animate-ultra-slide-up delay-100">
            <Button
              variant="outline"
              onClick={() => setShowTechDocs(true)}
              className="bg-black/30 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm ultra-hover group"
            >
              <Code className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Technical Documentation
            </Button>
          </div>

          {/* Ultra-Enhanced Demo Credentials */}
          <Card className="backdrop-blur-xl bg-white/15 border border-white/25 shadow-2xl animate-ultra-slide-up delay-200 ultra-hover hover:shadow-purple-500/30 transition-all duration-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-center text-blue-300 flex items-center justify-center space-x-2">
                <Sparkles className="h-5 w-5 animate-floating" style={{ animationDuration: '4s' }} />
                <span className="text-shimmer">Demo Credentials</span>
                <Sparkles className="h-5 w-5 animate-floating" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4">
                <div className="p-5 bg-gradient-to-br from-blue-500/40 to-blue-600/30 backdrop-blur-sm rounded-xl border border-blue-400/40 hover:from-blue-500/50 hover:to-blue-600/40 transition-all duration-500 cursor-pointer ultra-hover" 
                     onClick={() => { setEmail('admin@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-blue-200" />
                      <strong className="text-blue-200 text-sm">Admin Access</strong>
                    </div>
                    <div className="w-2.5 h-2.5 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-blue-300 font-mono text-sm">admin@smarttasker.ai / password123</div>
                  <div className="text-xs text-blue-400 mt-2">Full system control & analytics</div>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-green-500/40 to-green-600/30 backdrop-blur-sm rounded-xl border border-green-400/40 hover:from-green-500/50 hover:to-green-600/40 transition-all duration-500 cursor-pointer ultra-hover"
                     onClick={() => { setEmail('teamlead@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 text-green-200" />
                      <strong className="text-green-200 text-sm">Team Leader</strong>
                    </div>
                    <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse delay-200"></div>
                  </div>
                  <div className="text-green-300 font-mono text-sm">teamlead@smarttasker.ai / password123</div>
                  <div className="text-xs text-green-400 mt-2">Team management & task assignment</div>
                </div>
                
                <div className="p-5 bg-gradient-to-br from-purple-500/40 to-purple-600/30 backdrop-blur-sm rounded-xl border border-purple-400/40 hover:from-purple-500/50 hover:to-purple-600/40 transition-all duration-500 cursor-pointer ultra-hover"
                     onClick={() => { setEmail('member@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Layers className="h-5 w-5 text-purple-200" />
                      <strong className="text-purple-200 text-sm">Team Member</strong>
                    </div>
                    <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-pulse delay-400"></div>
                  </div>
                  <div className="text-purple-300 font-mono text-sm">member@smarttasker.ai / password123</div>
                  <div className="text-xs text-purple-400 mt-2">Task execution & collaboration</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ultra-Enhanced Sign In Form */}
          <Card className="backdrop-blur-xl bg-white/15 border border-white/25 shadow-2xl animate-ultra-slide-up delay-400 ultra-hover hover:shadow-blue-500/30 transition-all duration-500">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl text-center text-white flex items-center justify-center space-x-3">
                <Database className="h-7 w-7 text-blue-400 animate-pulse" />
                <span className="gradient-text">Sign in</span>
              </CardTitle>
              <CardDescription className="text-center text-gray-300 text-base">
                Enter your credentials to access your AI-powered workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-gray-200 flex items-center space-x-2 text-sm">
                    <span>Email</span>
                  </Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`bg-white/15 border-white/25 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/50 transition-all duration-300 backdrop-blur-sm ultra-hover ${errors.email ? 'border-red-400' : ''}`}
                      disabled={loading}
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-400 animate-ultra-fade-in flex items-center space-x-2">
                      <span>⚠</span>
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-gray-200 text-sm">Password</Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`bg-white/15 border-white/25 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/50 transition-all duration-300 pr-12 backdrop-blur-sm ultra-hover ${errors.password ? 'border-red-400' : ''}`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-400 animate-ultra-fade-in flex items-center space-x-2">
                      <span>⚠</span>
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full relative group bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white font-semibold py-4 transition-all duration-500 hover:scale-105 hover:shadow-2xl ultra-hover animate-gradient-flow"
                  disabled={loading}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-lg blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative flex items-center justify-center">
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        <span className="text-shimmer">Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="text-shimmer">Launch SmartTasker AI</span>
                      </>
                    )}
                  </div>
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Ultra-Enhanced Footer */}
          <div className="text-center text-gray-400 text-sm animate-ultra-fade-in delay-600 space-y-3">
            <p className="flex items-center justify-center space-x-3">
              <Brain className="h-5 w-5 text-purple-400 animate-floating" />
              <span className="text-shimmer">Experience the future of task management</span>
              <Brain className="h-5 w-5 text-purple-400 animate-floating" style={{ animationDelay: '1s' }} />
            </p>
            <div className="flex items-center justify-center space-x-6 text-xs">
              <span className="flex items-center space-x-2 ultra-hover">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span>AI Ready</span>
              </span>
              <span className="flex items-center space-x-2 ultra-hover">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                <span>Cloud Powered</span>
              </span>
              <span className="flex items-center space-x-2 ultra-hover">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-400"></div>
                <span>Enterprise Ready</span>
              </span>
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
