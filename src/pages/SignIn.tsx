
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
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-green-600/20 animate-pulse"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-green-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-purple-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '5s' }}></div>
        <div className="absolute top-1/2 right-1/3 w-36 h-36 bg-yellow-500/10 rounded-full blur-xl animate-bounce" style={{ animationDelay: '3s', animationDuration: '3.5s' }}></div>
        
        {/* Moving gradient lines */}
        <div className="absolute inset-0">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent top-1/4 animate-pulse"></div>
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent top-1/2 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-green-500/50 to-transparent top-3/4 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        {/* Grid pattern with animation */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] animate-pulse" style={{ animationDuration: '4s' }}></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Enhanced Logo and Brand */}
          <div className="text-center space-y-6 animate-fade-in">
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 rounded-3xl blur-lg opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-300 animate-pulse"></div>
              <div className="relative mx-auto w-24 h-24 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
                <Bot className="text-white font-bold text-3xl h-12 w-12" />
                <div className="absolute -top-2 -right-2 animate-spin" style={{ animationDuration: '3s' }}>
                  <Sparkles className="h-8 w-8 text-yellow-400" />
                </div>
                <div className="absolute -bottom-1 -left-1 animate-bounce">
                  <Brain className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-green-200 bg-clip-text text-transparent animate-pulse">
                SmartTasker AI
              </h1>
              <p className="text-gray-300 text-xl font-medium">Intelligent Task Management System</p>
              <div className="flex items-center justify-center space-x-3 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4 text-yellow-400 animate-pulse" />
                  <span>AI Powered</span>
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-green-400 animate-pulse" />
                  <span>Secure</span>
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="flex items-center space-x-1">
                  <Rocket className="h-4 w-4 text-purple-400 animate-pulse" />
                  <span>Fast</span>
                </div>
              </div>
            </div>
          </div>

          {/* Technical Documentation Button */}
          <div className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Button
              variant="outline"
              onClick={() => setShowTechDocs(true)}
              className="bg-black/20 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
            >
              <Code className="h-4 w-4 mr-2" />
              Technical Documentation
            </Button>
          </div>

          {/* Enhanced Demo Credentials */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl animate-slide-up hover:shadow-purple-500/20 transition-all duration-300" style={{ animationDelay: '0.2s' }}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-center text-blue-300 flex items-center justify-center space-x-2">
                <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '3s' }} />
                <span>Demo Credentials</span>
                <Sparkles className="h-4 w-4 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-3">
                <div className="p-4 bg-gradient-to-br from-blue-500/30 to-blue-600/20 backdrop-blur-sm rounded-xl border border-blue-400/30 hover:from-blue-500/40 hover:to-blue-600/30 transition-all cursor-pointer transform hover:scale-105 hover:shadow-lg" 
                     onClick={() => { setEmail('admin@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-blue-200" />
                      <strong className="text-blue-200">Admin Access</strong>
                    </div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-blue-300 font-mono">admin@smarttasker.ai / password123</div>
                  <div className="text-xs text-blue-400 mt-1">Full system control & analytics</div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-green-500/30 to-green-600/20 backdrop-blur-sm rounded-xl border border-green-400/30 hover:from-green-500/40 hover:to-green-600/30 transition-all cursor-pointer transform hover:scale-105 hover:shadow-lg"
                     onClick={() => { setEmail('teamlead@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-200" />
                      <strong className="text-green-200">Team Leader</strong>
                    </div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-green-300 font-mono">teamlead@smarttasker.ai / password123</div>
                  <div className="text-xs text-green-400 mt-1">Team management & task assignment</div>
                </div>
                
                <div className="p-4 bg-gradient-to-br from-purple-500/30 to-purple-600/20 backdrop-blur-sm rounded-xl border border-purple-400/30 hover:from-purple-500/40 hover:to-purple-600/30 transition-all cursor-pointer transform hover:scale-105 hover:shadow-lg"
                     onClick={() => { setEmail('member@smarttasker.ai'); setPassword('password123'); }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Layers className="h-4 w-4 text-purple-200" />
                      <strong className="text-purple-200">Team Member</strong>
                    </div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-purple-300 font-mono">member@smarttasker.ai / password123</div>
                  <div className="text-xs text-purple-400 mt-1">Task execution & collaboration</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Sign In Form */}
          <Card className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl animate-slide-up hover:shadow-blue-500/20 transition-all duration-300" style={{ animationDelay: '0.4s' }}>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl text-center text-white flex items-center justify-center space-x-2">
                <Database className="h-6 w-6 text-blue-400" />
                <span>Sign in</span>
              </CardTitle>
              <CardDescription className="text-center text-gray-300">
                Enter your credentials to access your AI-powered workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-200 flex items-center space-x-2">
                    <span>Email</span>
                  </Label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/50 transition-all backdrop-blur-sm ${errors.email ? 'border-red-400' : ''}`}
                      disabled={loading}
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-400 animate-fade-in flex items-center space-x-1">
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
                      className={`bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-blue-400 focus:ring-blue-400/50 transition-all pr-10 backdrop-blur-sm ${errors.password ? 'border-red-400' : ''}`}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-400 animate-fade-in flex items-center space-x-1">
                      <span>⚠</span>
                      <span>{errors.password}</span>
                    </p>
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
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-5 w-5" />
                        Launch SmartTasker AI
                      </>
                    )}
                  </div>
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {/* Enhanced Footer */}
          <div className="text-center text-gray-400 text-sm animate-fade-in space-y-2" style={{ animationDelay: '0.6s' }}>
            <p className="flex items-center justify-center space-x-2">
              <Brain className="h-4 w-4 text-purple-400" />
              <span>Experience the future of task management</span>
              <Brain className="h-4 w-4 text-purple-400" />
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs">
              <span className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                <span>AI Ready</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Cloud Powered</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
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
