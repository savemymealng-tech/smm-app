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
    accentBg: string;
    titleColor: string;
    descriptionColor: string;
    buttonBg: string;
    buttonTextColor: string;
    buttonText: string;
  }
> = {
  success: {
    icon: 'checkmark.circle.fill',
    iconColor: '#16a34a',
    iconBg: 'bg-green-100',
    accentBg: 'bg-green-600',
    titleColor: 'text-[#166534]',
    descriptionColor: 'text-[#166534]/80',
    buttonBg: 'bg-green-600',
    buttonTextColor: 'text-white',
    buttonText: 'Continue',
  },
  error: {
    icon: 'xmark.circle.fill',
    iconColor: '#dc2626',
    iconBg: 'bg-red-100',
    accentBg: 'bg-red-600',
    titleColor: 'text-[#991B1B]',
    descriptionColor: 'text-[#991B1B]/80',
    buttonBg: 'bg-red-600',
    buttonTextColor: 'text-white',
    buttonText: 'Close',
  },
  warning: {
    icon: 'exclamationmark.triangle.fill',
    iconColor: '#d97706',
    iconBg: 'bg-amber-100',
    accentBg: 'bg-amber-500',
    titleColor: 'text-[#92400E]',
    descriptionColor: 'text-[#92400E]/80',
    buttonBg: 'bg-amber-600',
    buttonTextColor: 'text-white',
    buttonText: 'Understood',
  },
  info: {
    icon: 'info.circle.fill',
    iconColor: '#2563eb',
    iconBg: 'bg-blue-100',
    accentBg: 'bg-blue-600',
    titleColor: 'text-[#1E3A8A]',
    descriptionColor: 'text-[#1E3A8A]/80',
    buttonBg: 'bg-blue-600',
    buttonTextColor: 'text-white',
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
          <AlertDialogContent className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-0">
            <View className={`h-1.5 w-full ${config.accentBg}`} />

            <View className="px-6 py-6">
              <AlertDialogHeader className="items-center">
                <View className={`mb-1 h-14 w-14 items-center justify-center rounded-full ${config.iconBg}`}>
                  <IconSymbol name={config.icon as any} size={27} color={config.iconColor} />
                </View>
                <AlertDialogTitle className={`text-center text-[22px] font-bold tracking-tight ${config.titleColor}`}>
                  {active.title}
                </AlertDialogTitle>
                {active.message ? (
                  <AlertDialogDescription className={`mt-0.5 text-center text-[15px] leading-6 ${config.descriptionColor}`}>
                    {active.message}
                  </AlertDialogDescription>
                ) : null}
              </AlertDialogHeader>

              <AlertDialogFooter className="mt-5">
                <AlertDialogAction
                  onPress={handleCloseActive}
                  className={`w-full rounded-2xl ${config.buttonBg}`}
                >
                  <Text className={`font-semibold ${config.buttonTextColor}`}>{config.buttonText}</Text>
                </AlertDialogAction>
              </AlertDialogFooter>
            </View>
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
