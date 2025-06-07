import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

/**
 * Offline Banner Component
 * Displays a banner when the user is offline
 */
const OfflineBanner: React.FC = () => {
  const { isOnline } = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-destructive text-destructive-foreground p-2 flex items-center justify-center z-50">
      <WifiOff className="h-4 w-4 mr-2" />
      <span>
        You are currently offline. Some features may be unavailable until you reconnect.
      </span>
    </div>
  );
};

export default OfflineBanner; 