/**
 * Global alert notification system.
 *
 * Keeps the existing `toast.success/error/warning/info` API,
 * but renders messages with AlertDialog instead of toast banners.
 */

import * as React from 'react';
import { View } from 'react-native';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from './alert-dialog';
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

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

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

const dialogConfig: Record<
  ToastType,
  {
    icon: string;
    iconColor: string;
    iconBg: string;
    titleColor: string;
    buttonBg: string;
    buttonText: string;
  }
> = {
  success: {
    icon: 'checkmark.circle.fill',
    iconColor: '#16a34a',
    iconBg: 'bg-green-50',
    titleColor: 'text-green-700',
    buttonBg: 'bg-green-600',
    buttonText: 'Continue',
  },
  error: {
    icon: 'xmark.circle.fill',
    iconColor: '#dc2626',
    iconBg: 'bg-red-50',
    titleColor: 'text-red-700',
    buttonBg: 'bg-red-600',
    buttonText: 'Close',
  },
  warning: {
    icon: 'exclamationmark.triangle.fill',
    iconColor: '#d97706',
    iconBg: 'bg-amber-50',
    titleColor: 'text-amber-700',
    buttonBg: 'bg-amber-600',
    buttonText: 'Understood',
  },
  info: {
    icon: 'info.circle.fill',
    iconColor: '#2563eb',
    iconBg: 'bg-blue-50',
    titleColor: 'text-blue-700',
    buttonBg: 'bg-blue-600',
    buttonText: 'OK',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
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
    (title: string, message?: string) => showToast({ type: 'success', title, message }),
    [showToast]
  );

  const error = React.useCallback(
    (title: string, message?: string) => showToast({ type: 'error', title, message }),
    [showToast]
  );

  const warning = React.useCallback(
    (title: string, message?: string) => showToast({ type: 'warning', title, message }),
    [showToast]
  );

  const info = React.useCallback(
    (title: string, message?: string) => showToast({ type: 'info', title, message }),
    [showToast]
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
    () => ({ toast: showToast, success, error, warning, info, dismiss, dismissAll }),
    [showToast, success, error, warning, info, dismiss, dismissAll]
  );

  const config = active ? dialogConfig[active.type] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}

      {active && config && (
        <AlertDialog open={true} onOpenChange={(open) => !open && handleCloseActive()}>
          <AlertDialogContent className="rounded-3xl px-6 py-7">
            <AlertDialogHeader className="items-center">
              <View className={`mb-1 h-14 w-14 items-center justify-center rounded-full ${config.iconBg}`}>
                <IconSymbol name={config.icon as any} size={28} color={config.iconColor} />
              </View>
              <AlertDialogTitle className={`text-center text-xl font-bold ${config.titleColor}`}>
                {active.title}
              </AlertDialogTitle>
              {active.message ? (
                <AlertDialogDescription className="mt-1 text-center text-sm leading-5 text-gray-600">
                  {active.message}
                </AlertDialogDescription>
              ) : null}
            </AlertDialogHeader>

            <AlertDialogFooter className="mt-4">
              <AlertDialogAction
                onPress={handleCloseActive}
                className={`w-full rounded-xl ${config.buttonBg}`}
              >
                <Text className="text-white font-semibold">{config.buttonText}</Text>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
