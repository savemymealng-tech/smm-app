import { useCallback, useRef, useState } from 'react';

/** Refresh independent screen resources together without duplicate requests. */
export function useDetailRefresh(actions: (() => Promise<unknown>)[]) {
  const latest = useRef(actions);
  latest.current = actions;
  const running = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState('');
  const refresh = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setRefreshing(true);
    setRefreshError('');
    try {
      const results = await Promise.allSettled(
        latest.current.map((action) => Promise.resolve().then(action)),
      );
      if (results.some((result) => result.status === 'rejected')) {
        setRefreshError(
          'Some information could not refresh. Check your connection and try again.',
        );
      }
    } finally {
      running.current = false;
      setRefreshing(false);
    }
  }, []);
  return { refreshing, refreshError, refresh };
}
