import { buttonTextVariants, buttonVariants } from '@/components/ui/button';
import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { Text, TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import * as AlertDialogPrimitive from '@rn-primitives/alert-dialog';
import * as React from 'react';
import {
  Platform,
  Text as RNText,
  type StyleProp,
  type TextStyle,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewProps,
} from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';

const CompactDialogContext = React.createContext(false);
function useCompactButtons() {
  const compact = React.useContext(CompactDialogContext);
  const { width, fontScale } = useWindowDimensions();
  const row = compact && width >= 340 && fontScale <= 1.2;
  return {
    compact,
    row,
    button: compact
      ? {
          ...dialogStyles.button,
          width: row ? undefined : ('100%' as const),
          flexGrow: row ? 1 : 0,
          flexShrink: row ? 1 : 0,
          flexBasis: row ? 0 : ('auto' as const),
          minHeight: 42,
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderRadius: 10,
        }
      : dialogStyles.button,
  };
}
const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

const AlertDialogPortal = AlertDialogPrimitive.Portal;

const FullWindowOverlay =
  Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

function AlertDialogOverlay({
  className,
  children,
  style,
  ...props
}: Omit<AlertDialogPrimitive.OverlayProps, 'asChild'> &
  React.RefAttributes<AlertDialogPrimitive.OverlayRef> & {
    children?: React.ReactNode;
  }) {
  return (
    <FullWindowOverlay>
      <AlertDialogPrimitive.Overlay
        className={cn(
          'absolute bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black/55 p-3',
          Platform.select({
            web: 'animate-in fade-in-0 fixed backdrop-blur-[2px]',
          }),
          className,
        )}
        style={StyleSheet.flatten([dialogStyles.overlay, style])}
        {...props}
      >
        <NativeOnlyAnimatedView
          entering={FadeIn.duration(200).delay(50)}
          exiting={FadeOut.duration(150)}
        >
          <>{children}</>
        </NativeOnlyAnimatedView>
      </AlertDialogPrimitive.Overlay>
    </FullWindowOverlay>
  );
}

function AlertDialogContent({
  className,
  portalHost,
  compact = false,
  children,
  style,
  ...props
}: AlertDialogPrimitive.ContentProps &
  React.RefAttributes<AlertDialogPrimitive.ContentRef> & {
    portalHost?: string;
    compact?: boolean;
    children?: React.ReactNode;
  }) {
  const { width, height } = useWindowDimensions();
  return (
    <AlertDialogPortal hostName={portalHost}>
      <AlertDialogOverlay>
        <CompactDialogContext.Provider value={compact}>
          <AlertDialogPrimitive.Content
            className={cn(
              'z-50 flex flex-col gap-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl',
              Platform.select({
                web: 'animate-in fade-in-0 zoom-in-95 duration-200',
              }),
              className,
            )}
            style={StyleSheet.flatten([
              dialogStyles.content,
              {
                width: Math.min(width - 40, compact ? 320 : 420),
                maxHeight: height - 80,
                ...(compact ? { padding: 18, gap: 14, borderRadius: 20 } : {}),
              },
              style,
            ])}
            {...props}
          >
            {children}
          </AlertDialogPrimitive.Content>
        </CompactDialogContext.Provider>
      </AlertDialogOverlay>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, style, ...props }: ViewProps) {
  const compact = React.useContext(CompactDialogContext);
  return (
    <TextClassContext.Provider value="text-left">
      <View
        className={cn('flex flex-col gap-3', className)}
        style={[{ gap: compact ? 8 : 12 }, style]}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function AlertDialogFooter({ className, style, ...props }: ViewProps) {
  const { row, compact } = useCompactButtons();
  return (
    <View
      className={cn('mt-1 flex flex-col gap-3', className)}
      style={[
        {
          flexDirection: row ? 'row' : 'column',
          gap: compact ? 10 : 12,
          alignSelf: 'stretch',
        },
        style,
      ]}
      {...props}
    />
  );
}

function AlertDialogTitle({
  className,
  style,
  ...props
}: AlertDialogPrimitive.TitleProps &
  React.RefAttributes<AlertDialogPrimitive.TitleRef>) {
  const compact = React.useContext(CompactDialogContext);
  return (
    <AlertDialogPrimitive.Title
      className={cn(
        'text-xl font-bold tracking-tight text-gray-900',
        className,
      )}
      style={StyleSheet.flatten([
        {
          fontSize: compact ? 18 : 22,
          fontWeight: '700',
          lineHeight: compact ? 24 : 28,
          color: '#111827',
        },
        style,
      ])}
      {...props}
    />
  );
}

function AlertDialogDescription({
  className,
  style,
  ...props
}: AlertDialogPrimitive.DescriptionProps &
  React.RefAttributes<AlertDialogPrimitive.DescriptionRef>) {
  const compact = React.useContext(CompactDialogContext);
  return (
    <AlertDialogPrimitive.Description
      className={cn('text-[15px] leading-6 text-gray-600', className)}
      style={StyleSheet.flatten([
        {
          fontSize: compact ? 14 : 15,
          lineHeight: compact ? 21 : 23,
          color: '#4b5563',
        },
        style,
      ])}
      {...props}
    />
  );
}

function AlertDialogAction({
  className,
  children,
  style,
  tone = 'default',
  ...props
}: AlertDialogPrimitive.ActionProps & {
  tone?: 'default' | 'destructive';
} & React.RefAttributes<AlertDialogPrimitive.ActionRef>) {
  const { button, compact } = useCompactButtons();
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), 'min-h-12 rounded-2xl px-6', className)}
      style={
        Platform.OS === 'web'
          ? StyleSheet.flatten([
              button,
              {
                backgroundColor: tone === 'destructive' ? '#dc2626' : '#008236',
              },
              typeof style === 'function'
                ? style({ pressed: false, hovered: false })
                : style,
            ])
          : (state) => [
              button,
              {
                backgroundColor: tone === 'destructive' ? '#dc2626' : '#008236',
              },
              typeof style === 'function' ? style(state) : style,
            ]
      }
      {...props}
    >
      <TextClassContext.Provider value={buttonTextVariants()}>
        {actionLabels(children as React.ReactNode, '#fff', compact)}
      </TextClassContext.Provider>
    </AlertDialogPrimitive.Action>
  );
}

function AlertDialogCancel({
  className,
  children,
  style,
  ...props
}: AlertDialogPrimitive.CancelProps &
  React.RefAttributes<AlertDialogPrimitive.CancelRef>) {
  const { button, compact } = useCompactButtons();
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(
        buttonVariants({ variant: 'outline' }),
        'min-h-12 rounded-2xl border-gray-200 bg-gray-50 px-6',
        className,
      )}
      style={
        Platform.OS === 'web'
          ? StyleSheet.flatten([
              button,
              {
                backgroundColor: '#f9fafb',
                borderWidth: 1,
                borderColor: '#d1d5db',
              },
              typeof style === 'function'
                ? style({ pressed: false, hovered: false })
                : style,
            ])
          : (state) => [
              button,
              {
                backgroundColor: '#f9fafb',
                borderWidth: 1,
                borderColor: '#d1d5db',
              },
              typeof style === 'function' ? style(state) : style,
            ]
      }
      {...props}
    >
      <TextClassContext.Provider
        value={buttonTextVariants({ variant: 'outline' })}
      >
        {actionLabels(children as React.ReactNode, '#374151', compact)}
      </TextClassContext.Provider>
    </AlertDialogPrimitive.Cancel>
  );
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};

const dialogStyles = StyleSheet.create({
  button: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    gap: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
});

function actionLabels(
  children: React.ReactNode,
  color: string,
  compact = false,
) {
  return React.Children.map(children, (child) => {
    if (
      !React.isValidElement<{ style?: StyleProp<TextStyle> }>(child) ||
      (child.type !== Text && child.type !== RNText)
    )
      return child;
    return React.cloneElement(child, {
      style: [
        {
          textAlign: 'center',
          fontSize: compact ? 14 : 15,
          fontWeight: '600',
          color,
        },
        child.props.style,
      ],
    });
  });
}
