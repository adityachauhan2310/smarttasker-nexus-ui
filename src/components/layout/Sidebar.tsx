
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Home,
  MessageSquare,
  Settings,
  Users,
  UserCheck,
  ClipboardList,
  Target,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'AI Assistant',
        href: '/ai-chat',
        icon: MessageSquare,
        roles: ['admin', 'team_leader', 'team_member'],
      },
    ];

    if (user?.role === 'admin') {
      return [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'Team Management', href: '/admin/teams', icon: UserCheck },
        { name: 'Tasks', href: '/admin/tasks', icon: CheckSquare },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
        ...baseItems,
      ];
    }

    if (user?.role === 'team_leader') {
      return [
        { name: 'Dashboard', href: '/team-leader/dashboard', icon: Home },
        { name: 'Team Calendar', href: '/team-leader/calendar', icon: Calendar },
        { name: 'Assign Tasks', href: '/team-leader/assign-tasks', icon: Target },
        { name: 'Team Members', href: '/team-leader/team-members', icon: Users },
        { name: 'My Tasks', href: '/tasks', icon: CheckSquare },
        ...baseItems,
      ];
    }

    return [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'My Tasks', href: '/tasks', icon: ClipboardList },
      { name: 'Calendar', href: '/calendar', icon: Calendar },
      ...baseItems,
    ];
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">ST</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">SmartTasker</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI Powered</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.name} to={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start text-left',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Role Badge */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Role</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
            {user?.role?.replace('_', ' ')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
