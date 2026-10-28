import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from './alert-dialog';
import { IconSymbol } from './icon-symbol';
export function OutcomeDialog({
  open,
  onClose,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  kind = 'success',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  kind?: 'success' | 'pending' | 'error';
}) {
  const { height } = useWindowDimensions();
  const color =
    kind === 'success' ? '#008236' : kind === 'pending' ? '#b45309' : '#b91c1c';
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <AlertDialogContent>
        <ScrollView
          style={{ maxHeight: Math.max(120, height - 320) }}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.icon,
              {
                backgroundColor:
                  kind === 'success'
                    ? '#f0fdf4'
                    : kind === 'pending'
                      ? '#fffbeb'
                      : '#fef2f2',
              },
            ]}
          >
            <IconSymbol
              name={
                kind === 'success'
                  ? 'checkmark.circle.fill'
                  : kind === 'pending'
                    ? 'clock.fill'
                    : 'exclamationmark.triangle.fill'
              }
              color={color}
              size={32}
            />
          </View>
          <AlertDialogTitle style={{ textAlign: 'center' }}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription style={{ textAlign: 'center' }}>
            {message}
          </AlertDialogDescription>
        </ScrollView>
        <AlertDialogFooter>
          <AlertDialogAction
            style={[styles.button, { backgroundColor: '#008236' }]}
            onPress={onPrimary}
          >
            <Text style={[styles.label, { color: '#fff' }]}>
              {primaryLabel}
            </Text>
          </AlertDialogAction>
          {secondaryLabel && onSecondary && (
            <AlertDialogAction
              style={[styles.button, { backgroundColor: '#f3f4f6' }]}
              onPress={onSecondary}
            >
              <Text style={[styles.label, { color: '#374151' }]}>
                {secondaryLabel}
              </Text>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: 14, paddingVertical: 4 },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  button: {
    width: '100%',
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});
