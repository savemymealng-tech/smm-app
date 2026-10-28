import { View, Text } from 'react-native';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from './alert-dialog';
import { Action, palette } from './screen-kit';
export function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel = 'Cancel',
  onSecondary,
  busy = false,
  destructive = false,
  error,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  busy?: boolean;
  destructive?: boolean;
  error?: string;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!value && !busy) onClose();
      }}
    >
      <AlertDialogContent compact>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{ fontSize: 13, lineHeight: 19, color: palette.red }}
          >
            {error}
          </Text>
        )}
        <View style={{ gap: 8 }}>
          <Action
            label={primaryLabel}
            onPress={onPrimary}
            busy={busy}
            danger={destructive}
          />
          <Action
            secondary
            label={secondaryLabel}
            onPress={onSecondary || onClose}
            disabled={busy}
          />
        </View>
      </AlertDialogContent>
    </AlertDialog>
  );
}
