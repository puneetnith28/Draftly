'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { diContainer } from '../infrastructure/di/container';

export function AuthSync({ children }: { children: React.ReactNode }) {
  const { getToken, userId, isLoaded } = useAuth();
  const [synced, setSynced] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        diContainer.setAuthToken(async () => {
          return await getToken({ template: 'supabase' });
        }, userId);
        setSynced(true);
      } catch (e: any) {
        console.error('Failed to sync auth token to DI container', e);
        setErrorMsg(e.message || 'Failed to sync authentication token');
        setSynced(true); // Allow through so we don't get a blank screen
      }
    };

    if (isLoaded) {
      syncAuth();
    }
  }, [getToken, userId, isLoaded]);

  if (errorMsg && !synced) {
    return <div style={{ padding: 20, color: 'red' }}>Error: {errorMsg}</div>;
  }

  if (!isLoaded || !synced) {
    return <div style={{ padding: 20 }}>Loading authentication...</div>;
  }

  return <>{children}</>;
}
