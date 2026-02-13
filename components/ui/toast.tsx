/**
 * Toast Component
 * A simple toast notification system for the app
 * 
 * Can be used in two ways:
 * 1. Via useToast() hook in React components
 * 2. Via toast.success(), toast.error() etc. anywhere (including outside React)
 */

import { cn } from '@/lib/utils';
import { Portal } from '@rn-primitives/portal';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
    FadeInUp,
    FadeOutUp,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
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

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

const toastConfig: Record<ToastType, { icon: string; bgColor: string; iconColor: string }> = {
  success: {
    icon: 'checkmark.circle.fill',
    bgColor: 'bg-green-600',
    iconColor: '#ffffff',
  },
  error: {
    icon: 'xmark.circle.fill',
    bgColor: 'bg-red-500',
    iconColor: '#ffffff',
  },
  warning: {
    icon: 'exclamationmark.triangle.fill',
    bgColor: 'bg-amber-500',
    iconColor: '#ffffff',
  },
  info: {
    icon: 'info.circle.fill',
    bgColor: 'bg-blue-500',
    iconColor: '#ffffff',
  },
};

// Global toast event emitter for use outside React components
type ToastListener = (toast: ToastData) => void;
const toastListeners: Set<ToastListener> = new Set();

function emitToast(toastData: Omit<ToastData, 'id'>) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const fullToast: ToastData = { id, duration: 3000, ...toastData };
  toastListeners.forEach(listener => listener(fullToast));
}

/**
 * Global toast object for use anywhere in the app
 * Works outside of React components
 */
export const toast = {
  show: (options: Omit<ToastData, 'id'>) => emitToast(options),
  success: (title: string, message?: string) => 
    emitToast({ type: 'success', title, message }),
  error: (title: string, message?: string) => 
    emitToast({ type: 'error', title, message, duration: 4000 }),
  warning: (title: string, message?: string) => 
    emitToast({ type: 'warning', title, message }),
  info: (title: string, message?: string) => 
    emitToast({ type: 'info', title, message }),
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const config = toastConfig[toast.type];
  const progress = useSharedValue(1);

  React.useEffect(() => {
    const duration = toast.duration || 3000;
    progress.value = withTiming(0, { duration }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  }, [toast.duration, onDismiss, progress]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <Animated.View
      entering={FadeInUp.springify().damping(15)}
      exiting={FadeOutUp.duration(200)}
      className={cn(
        'mx-4 mb-2 rounded-2xl overflow-hidden',
        config.bgColor
      )}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
      }}
    >
      <Pressable
        onPress={onDismiss}
        className="flex-row items-center p-4"
      >
        <IconSymbol
          name={config.icon as any}
          size={24}
          color={config.iconColor}
        />
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold text-base">
            {toast.title}
          </Text>
          {toast.message && (
            <Text className="text-white/80 text-sm mt-0.5">
              {toast.message}
            </Text>
          )}
        </View>
        <IconSymbol
          name="xmark"
          size={18}
          color="rgba(255,255,255,0.6)"
        />
      </Pressable>
      
      {/* Progress bar */}
      <View className="h-1 bg-black/10">
        <Animated.View
          style={[{ height: '100%', backgroundColor: 'rgba(255,255,255,0.3)' }, progressStyle]}
        />
      </View>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastData[]>([]);
  const insets = useSafeAreaInsets();

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = React.useCallback((newToast: ToastData) => {
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showToast = React.useCallback((options: Omit<ToastData, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const newToast: ToastData = {
      id,
      duration: 3000,
      ...options,
    };
    
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const success = React.useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = React.useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message, duration: 4000 });
  }, [showToast]);

  const warning = React.useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = React.useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  // Subscribe to global toast emitter
  React.useEffect(() => {
    const listener: ToastListener = (toastData) => {
      addToast(toastData);
    };
    
    toastListeners.add(listener);
    return () => {
      toastListeners.delete(listener);
    };
  }, [addToast]);

  const value = React.useMemo(
    () => ({ toast: showToast, success, error, warning, info, dismiss, dismissAll }),
    [showToast, success, error, warning, info, dismiss, dismissAll]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast container - render in Portal to overlay navigation */}
      <Portal>
        <View
          pointerEvents="box-none"
          className="absolute left-0 right-0"
          style={{ 
            top: insets.top + 8,
            zIndex: 9999,
          }}
        >
          {toasts.map((t) => (
            <ToastItem
              key={t.id}
              toast={t}
              onDismiss={() => dismiss(t.id)}
            />
          ))}
        </View>
      </Portal>
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
