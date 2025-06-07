import React, { memo, useCallback, useMemo } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, Info, AlertTriangle, XCircle, X } from 'lucide-react';

interface NotificationCenterProps {
  children: React.ReactNode;
}

// Memoize the notification item to prevent unnecessary re-renders
const NotificationItem = memo(({ 
  notification, 
  markAsRead, 
  clearNotification,
  getIcon 
}: { 
  notification: any, 
  markAsRead: (id: string) => void, 
  clearNotification: (id: string) => void,
  getIcon: (type: string) => React.ReactNode 
}) => {
  const handleMarkAsRead = useCallback(() => {
    markAsRead(notification.id);
  }, [notification.id, markAsRead]);
  
  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    clearNotification(notification.id);
  }, [notification.id, clearNotification]);
  
  return (
    <div
      key={notification.id}
      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200' : ''
      }`}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {getIcon(notification.type)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="font-medium text-sm">{notification.title}</p>
              {!notification.read && (
                <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full bg-blue-500" />
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {notification.message}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

// Use memo for the main component
const NotificationCenter: React.FC<NotificationCenterProps> = memo(({ children }) => {
  const { notifications, markAsRead, markAllAsRead, clearNotification } = useNotifications();

  const getIcon = useCallback((type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const hasUnread = useMemo(() => 
    notifications.some(n => !n.read),
    [notifications]
  );

  console.log("Rendering NotificationCenter");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {hasUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  markAsRead={markAsRead}
                  clearNotification={clearNotification}
                  getIcon={getIcon}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

NotificationCenter.displayName = 'NotificationCenter';

export default NotificationCenter;
