import { authAtom } from '@/lib/atoms';
import { useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

/**
 * Redirects unauthenticated users to the login screen.
 * Returns { isAuthenticated, isLoading } so the caller can render null
 * while the redirect is in flight (avoids a content flash).
 *
 * Usage:
 *   const { isAuthenticated, isLoading } = useProtectedRoute();
 *   if (isLoading || !isAuthenticated) return null;
 */
export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAtomValue(authAtom);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading };
}
