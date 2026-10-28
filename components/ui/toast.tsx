/**
 * Non-blocking, dismissible notification banners with the existing toast API.
 */

import * as React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from './icon-symbol';
import { Text } from './text';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: Omit<ToastData, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined,
);

type ToastListener = (toast: ToastData) => void;
const toastListeners: Set<ToastListener> = new Set();

function emitToast(toastData: Omit<ToastData, 'id'>) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fullToast: ToastData = { id, ...toastData };
  toastListeners.forEach((listener) => listener(fullToast));
}

export const toast = {
  show: (options: Omit<ToastData, 'id'>) => emitToast(options),
  success: (title: string, message?: string) =>
    emitToast({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    emitToast({ type: 'error', title, message }),
  warning: (title: string, message?: string) =>
    emitToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) =>
    emitToast({ type: 'info', title, message }),
};

const dialogConfig: Record<ToastType, { icon: string; iconColor: string }> = {
  success: { icon: 'checkmark.circle.fill', iconColor: '#008236' },
  error: { icon: 'exclamationmark.triangle.fill', iconColor: '#b91c1c' },
  warning: { icon: 'exclamationmark.triangle.fill', iconColor: '#b45309' },
  info: { icon: 'info.circle.fill', iconColor: '#2563eb' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = React.useState<ToastData[]>([]);
  const [active, setActive] = React.useState<ToastData | null>(null);

  const dismiss = React.useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    setActive((prev) => (prev?.id === id ? null : prev));
  }, []);

  const dismissAll = React.useCallback(() => {
    setQueue([]);
    setActive(null);
  }, []);

  const showToast = React.useCallback((options: Omit<ToastData, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setQueue((prev) => [...prev, { id, ...options }]);
  }, []);

  const success = React.useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'success', title, message }),
    [showToast],
  );

  const error = React.useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'error', title, message }),
    [showToast],
  );

  const warning = React.useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'warning', title, message }),
    [showToast],
  );

  const info = React.useCallback(
    (title: string, message?: string) =>
      showToast({ type: 'info', title, message }),
    [showToast],
  );

  React.useEffect(() => {
    const listener: ToastListener = (toastData) => {
      setQueue((prev) => [...prev, toastData]);
    };

    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, []);

  React.useEffect(() => {
    if (!active && queue.length > 0) {
      setActive(queue[0]);
    }
  }, [queue, active]);

  const handleCloseActive = React.useCallback(() => {
    if (!active) return;
    setQueue((prev) => prev.filter((item) => item.id !== active.id));
    setActive(null);
  }, [active]);

  const value = React.useMemo(
    () => ({
      toast: showToast,
      success,
      error,
      warning,
      info,
      dismiss,
      dismissAll,
    }),
    [showToast, success, error, warning, info, dismiss, dismissAll],
  );

  React.useEffect(() => {
    if (!active) return;
    const timer = setTimeout(
      handleCloseActive,
      active.duration ?? (active.type === 'error' ? 7000 : 4000),
    );
    return () => clearTimeout(timer);
  }, [active, handleCloseActive]);
  const config = active ? dialogConfig[active.type] : null;
  return (
    <ToastContext.Provider value={value}>
      {children}
      {active && config && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            top: insets.top + 12,
            left: 16,
            right: 16,
            zIndex: 9999,
            elevation: 30,
          }}
        >
          <Pressable
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${active.title}. ${active.message || ''}. Tap to dismiss.`}
            onPress={handleCloseActive}
            className="flex-row items-start rounded-2xl border border-gray-200 bg-white p-4"
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              padding: 16,
              borderRadius: 18,
              backgroundColor: '#fff',
              borderWidth: 1,
              borderColor: '#e5e7eb',
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
            }}
          >
            <IconSymbol
              name={config.icon as any}
              size={24}
              color={active.type === 'success' ? '#008236' : config.iconColor}
            />
            <View style={{ flex: 1, marginHorizontal: 12 }}>
              <Text className="font-semibold text-gray-900">
                {active.title}
              </Text>
              {!!active.message && (
                <Text className="text-sm text-gray-600 mt-1">
                  {active.message}
                </Text>
              )}
            </View>
            <Text className="text-gray-400">✕</Text>
          </Pressable>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export { ToastContext };
