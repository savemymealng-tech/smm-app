import { forwardRef, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react-native';
import { BrandLogo } from '@/components/ui/brand-logo';
import { Card, palette, ui } from '@/components/ui/screen-kit';

export function AuthScreen({
  title,
  description,
  onBack,
  children,
  footer,
}: {
  title: string;
  description: string;
  onBack: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: palette.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 8,
          paddingBottom: Math.max(insets.bottom, 16),
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{ width: '100%', maxWidth: 440, alignSelf: 'center', flex: 1 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            style={{
              width: 44,
              height: 44,
              marginLeft: -8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={24} color={palette.ink} />
          </Pressable>
          <View style={{ gap: 14, paddingTop: 10, paddingBottom: 24 }}>
            <BrandLogo />
            <View style={{ gap: 7 }}>
              <Text accessibilityRole="header" style={styles.title}>
                {title}
              </Text>
              <Text style={ui.muted}>{description}</Text>
            </View>
          </View>
          <Card>{children}</Card>
          {!!footer && <View style={{ gap: 8, paddingTop: 16 }}>{footer}</View>}
          <View style={{ flex: 1, minHeight: 18 }} />
          <View
            style={{
              flexDirection: 'row',
              gap: 7,
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 12,
            }}
          >
            <View
              style={{
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: palette.orange,
              }}
            />
            <Text style={{ fontSize: 11, color: palette.muted }}>
              Save more. Waste less.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
export const AuthField = forwardRef<
  TextInput,
  TextInputProps & {
    label: string;
    error?: string;
    hint?: string;
    password?: boolean;
  }
>(function AuthField({ label, error, hint, password, ...props }, ref) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          {
            borderColor: error
              ? palette.red
              : focused
                ? palette.green
                : palette.border,
          },
        ]}
      >
        <TextInput
          {...props}
          ref={ref}
          accessibilityLabel={label}
          placeholderTextColor={palette.muted}
          secureTextEntry={password ? !visible : props.secureTextEntry}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
            accessibilityState={{ checked: visible }}
            disabled={props.editable === false}
            onPress={() => setVisible((value) => !value)}
            style={styles.eye}
          >
            {visible ? (
              <EyeOff size={18} color={palette.muted} />
            ) : (
              <Eye size={18} color={palette.muted} />
            )}
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      {!!hint && !error && (
        <Text style={{ fontSize: 11, lineHeight: 17, color: palette.muted }}>
          {hint}
        </Text>
      )}
    </View>
  );
});
export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View
      style={{
        backgroundColor: '#fff1f0',
        borderWidth: 1,
        borderColor: '#f1c5bf',
        padding: 12,
        borderRadius: 10,
      }}
    >
      <Text accessibilityRole="alert" style={styles.error}>
        {message}
      </Text>
    </View>
  );
}
export function AuthLink({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={{
        minHeight: 44,
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={ui.link}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: palette.ink,
  },
  label: { fontSize: 13, fontWeight: '600', color: palette.ink },
  inputRow: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: palette.ink,
    fontSize: 15,
  },
  eye: {
    width: 44,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontSize: 12, lineHeight: 18, color: palette.red },
});
