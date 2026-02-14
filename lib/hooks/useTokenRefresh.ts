/**
 * Token Refresh Hook
 * Implements automatic token refresh every 50 minutes
 * Runs unconditionally to keep users authenticated during inactivity
 */

import { useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { authApi } from '../api/auth';
import { tokenManager } from '../api/client';
import { updateTokensAtom } from '../atoms/auth';
import { isTokenExpired } from '../utils/jwt';

const REFRESH_INTERVAL = 50 * 60 * 1000; // 50 minutes in milliseconds

export function useTokenRefresh() {
  const updateTokens = useSetAtom(updateTokensAtom);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const refreshAccessToken = async () => {
      try {
        const refreshToken = await tokenManager.getRefreshToken();
        
        if (!refreshToken) {
          console.log('🔄 No refresh token found, logging out silently');
          await tokenManager.clearTokens();
          return;
        }

        console.log('🔄 Refreshing access token...');
        const newAccessToken = await authApi.refreshToken(refreshToken);
        
        // Update tokens in atom
        updateTokens(newAccessToken, refreshToken);
        
        console.log('✅ Token refreshed successfully');
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        
        // Only logout if token is actually expired
        const currentToken = await tokenManager.getAccessToken();
        if (isTokenExpired(currentToken)) {
          console.log('🚪 Token expired, logging out...');
          await tokenManager.clearTokens();
          // You might want to emit an event here to navigate to login
        }
      }
    };

    // Check token immediately on mount
    const checkInitialToken = async () => {
      const currentToken = await tokenManager.getAccessToken();
      if (isTokenExpired(currentToken)) {
        console.log('⚠️ Token expired on mount, refreshing immediately');
        await refreshAccessToken();
      }
    };

    // Setup interval for automatic refresh
    const setupInterval = () => {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Create new interval
      intervalRef.current = setInterval(() => {
        console.log('⏰ Background token refresh triggered (50-minute interval)');
        refreshAccessToken();
      }, REFRESH_INTERVAL);

      console.log('✅ Token refresh interval initialized (50 minutes)');
    };

    // Initialize
    checkInitialToken();
    setupInterval();

    // Handle app state change (user returns to app)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('👀 App became active, checking token...');
        const currentToken = await tokenManager.getAccessToken();
        if (isTokenExpired(currentToken)) {
          console.log('⚠️ Token expired while app was inactive, refreshing...');
          await refreshAccessToken();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      subscription.remove();
      isInitializedRef.current = false;
    };
  }, []); // Empty deps - run once, never re-run

  return null;
}
