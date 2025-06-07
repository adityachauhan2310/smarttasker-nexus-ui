import { useState, useEffect } from 'react';

/**
 * Hook to track online/offline status
 * @returns Object with online status and last changed timestamp
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [lastChanged, setLastChanged] = useState<Date>(new Date());

  useEffect(() => {
    // Update online status
    const handleOnline = () => {
      setIsOnline(true);
      setLastChanged(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastChanged(new Date());
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up event listeners
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    lastChanged,
  };
}

export default useOnlineStatus; 