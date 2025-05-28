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
    <div className="h-screen w-full overflow-hidden relative">
      {/* Ultra-Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/15 to-green-600/20 animate-gradient-flow"></div>
        
        {/* Enhanced floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-floating" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-40 h-40 bg-green-500/10 rounded-full blur-2xl animate-floating" style={{ animationDelay: '2s', animationDuration: '10s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl animate-floating" style={{ animationDelay: '4s', animationDuration: '12s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-36 h-36 bg-yellow-500/10 rounded-full blur-2xl animate-floating" style={{ animationDelay: '6s', animationDuration: '9s' }}></div>
        
        {/* Enhanced moving gradient lines */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent top-1/4 animate-pulse"></div>
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent top-1/2 animate-pulse delay-1000"></div>
          <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-green-500/40 to-transparent top-3/4 animate-pulse delay-2000"></div>
        </div>
        
        {/* Enhanced grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] animate-pulse" style={{ animationDuration: '6s' }}></div>
        
        {/* Enhanced floating particles */}
        <div className="absolute inset-0">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/15 rounded-full animate-floating"
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

      <div className="relative z-10 h-full flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Ultra-Enhanced Logo and Brand */}
          <div className="text-center space-y-4 animate-ultra-fade-in">
            <div className="relative group ultra-hover">
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-all duration-700 animate-gentle-glow"></div>
              <div className="relative mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-500 animate-gradient-flow">
                <Bot className="text-white font-bold text-3xl h-10 w-10" />
                <div className="absolute -top-2 -right-2 animate-floating" style={{ animationDuration: '4s' }}>
                  <Sparkles className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="absolute -bottom-1 -left-1 animate-floating" style={{ animationDelay: '2s' }}>
                  <Brain className="h-5 w-5 text-cyan-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-4xl font-bold gradient-text animate-gradient-flow">
                SmartTasker AI
              </h1>
              <p className="text-gray-300 text-lg font-medium animate-ultra-slide-up delay-200">Intelligent Task Management</p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-400 animate-ultra-slide-up delay-300">
                <div className="flex items-center space-x-1 ultra-hover">
                  <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
                  <span>AI Powered</span>
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="flex items-center space-x-1 ultra-hover">
                  <Shield className="h-4 w-4 text-green-400 animate-pulse delay-300" />
                  <span>Secure</span>
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                <div className="flex items-center space-x-1 ultra-hover">
                  <Rocket className="h-4 w-4 text-purple-400 animate-pulse delay-500" />
                  <span>Fast</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Documentation Button */}
          <div className="text-center animate-ultra-slide-up delay-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTechDocs(true)}
              className="bg-black/20 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm ultra-hover group text-xs"
            >
              <Code className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform duration-300" />
              Tech Documentation
            </Button>
          </div>

          {/* Ultra-Enhanced Demo Credentials */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl animate-ultra-slide-up delay-200 ultra-hover hover:shadow-purple-500/20 transition-all duration-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-center text-blue-300 flex items-center justify-center space-x-2">
                <Sparkles className="h-4 w-4 animate-floating" style={{ animationDuration: '4s' }} />
                <span className="text-shimmer">Demo Credentials</span>
                <Sparkles className="h-4 w-4 animate-floating" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500/30 to-blue-600/20 backdrop-blur-sm rounded-lg border border-blue-400/30 hover:from-blue-500/40 hover:to-blue-600/30 transition-all duration-500 cursor-pointer ultra-hover" 
                     onClick={() => { setEmail('admin@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-200" />
                      <strong className="text-blue-200 text-xs">Admin</strong>
                    </div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-blue-300 font-mono text-xs">admin@smarttasker.ai</div>
                  <div className="text-xs text-blue-400 mt-1">Full system control</div>
                </div>
                
                <div className="p-3 bg-gradient-to-br from-green-500/30 to-green-600/20 backdrop-blur-sm rounded-lg border border-green-400/30 hover:from-green-500/40 hover:to-green-600/30 transition-all duration-500 cursor-pointer ultra-hover"
                     onClick={() => { setEmail('teamlead@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-200" />
                      <strong className="text-green-200 text-xs">Team Leader</strong>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-200"></div>
                  </div>
                  <div className="text-green-300 font-mono text-xs">teamlead@smarttasker.ai</div>
                  <div className="text-xs text-green-400 mt-1">Team management</div>
                </div>
                
                <div className="p-3 bg-gradient-to-br from-purple-500/30 to-purple-600/20 backdrop-blur-sm rounded-lg border border-purple-400/30 hover:from-purple-500/40 hover:to-purple-600/30 transition-all duration-500 cursor-pointer ultra-hover"
                     onClick={() => { setEmail('member@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-purple-200" />
                      <strong className="text-purple-200 text-xs">Team Member</strong>
                    </div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-400"></div>
                  </div>
                  <div className="text-purple-300 font-mono text-xs">member@smarttasker.ai</div>
                  <div className="text-xs text-purple-400 mt-1">Task execution</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ultra-Enhanced Sign In Form */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl animate-ultra-slide-up delay-400 ultra-hover hover:shadow-blue-500/20 transition-all duration-500">
            <CardHeader className="space-y-1 pb-3">
              <CardTitle className="text-xl text-center text-white flex items-center justify-center space-x-2">
                <Database className="h-5 w-5 text-blue-400 animate-pulse" />
                <span className="gradient-text">Sign in</span>
              </CardTitle>
              <CardDescription className="text-center text-gray-300 text-sm">
                Enter credentials to access your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200 text-sm">Email</Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/30 transition-all duration-300 backdrop-blur-sm ultra-hover ${errors.email ? 'border-red-400' : ''}`}
                      disabled={loading}
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400 animate-ultra-fade-in flex items-center space-x-1">
                      <span>⚠</span>
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-200 text-sm">Password</Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/30 transition-all duration-300 pr-10 backdrop-blur-sm ultra-hover ${errors.password ? 'border-red-400' : ''}`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-400 animate-ultra-fade-in flex items-center space-x-1">
                      <span>⚠</span>
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full relative group bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 hover:from-blue-700 hover:via-purple-700 hover:to-green-700 text-white font-semibold py-3 transition-all duration-500 hover:scale-105 hover:shadow-xl ultra-hover animate-gradient-flow"
                  disabled={loading}
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-lg blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                  <div className="relative flex items-center justify-center">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <span className="text-shimmer">Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                        <span className="text-shimmer">Launch SmartTasker AI</span>
                      </>
                    )}
                  </div>
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Ultra-Enhanced Footer */}
          <div className="text-center text-gray-400 text-xs animate-ultra-fade-in delay-600 space-y-2">
            <p className="flex items-center justify-center space-x-2">
              <Brain className="h-4 w-4 text-purple-400 animate-floating" />
              <span className="text-shimmer">Experience the future of task management</span>
              <Brain className="h-4 w-4 text-purple-400 animate-floating" style={{ animationDelay: '1s' }} />
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <span className="flex items-center space-x-1 ultra-hover">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                <span>AI Ready</span>
              </span>
              <span className="flex items-center space-x-1 ultra-hover">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-200"></div>
                <span>Cloud Powered</span>
              </span>
              <span className="flex items-center space-x-1 ultra-hover">
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-400"></div>
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
