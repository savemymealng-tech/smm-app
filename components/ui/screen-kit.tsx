import { Brand } from '@/constants/theme';
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
export const palette = {
  green: Brand.green,
  orange: Brand.orange,
  orangeInk: Brand.orangeInk,
  orangeSurface: Brand.orangeSurface,
  greenSurface: Brand.greenSurface,
  ink: '#17251d',
  muted: '#66736c',
  border: '#e4e9e6',
  bg: '#f5f7f6',
  red: '#b42318',
};
export const ui = StyleSheet.create({
  title: { fontSize: 20, fontWeight: '700', color: palette.ink },
  heading: { fontSize: 16, fontWeight: '700', color: palette.ink },
  body: { fontSize: 14, lineHeight: 21, color: palette.ink },
  muted: { fontSize: 13, lineHeight: 20, color: palette.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: palette.ink,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  line: { height: 1, backgroundColor: palette.border },
  link: { fontSize: 14, fontWeight: '600', color: palette.green },
});
export function Screen({
  title,
  back = true,
  children,
  footer,
}: {
  title: string;
  back?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ flex: 1, backgroundColor: palette.bg, paddingTop: insets.top }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 60,
          paddingHorizontal: 16,
          gap: 8,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        }}
      >
        {back && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: -8,
            }}
          >
            <ChevronLeft size={24} color={palette.ink} />
          </Pressable>
        )}
        <Text style={ui.title}>{title}</Text>
      </View>
      {children}
      {footer && (
        <View
          style={{
            padding: 16,
            paddingBottom: Math.max(16, insets.bottom),
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: palette.border,
          }}
        >
          {footer}
        </View>
      )}
    </View>
  );
}
export function PageScroll({
  children,
  contentContainerStyle,
  ...props
}: ScrollViewProps) {
  const inset = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        { padding: 16, paddingBottom: inset.bottom + 24, gap: 16 },
        contentContainerStyle,
      ]}
      {...props}
    >
      {children}
    </ScrollView>
  );
}
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        padding: 16,
        gap: 12,
        borderRadius: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: palette.border,
        shadowColor: '#193c28',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.025,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {children}
    </View>
  );
}
export function Action({
  label,
  onPress,
  secondary = false,
  danger = false,
  tone = 'primary',
  disabled = false,
  busy = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  danger?: boolean;
  tone?: 'primary' | 'accent';
  disabled?: boolean;
  busy?: boolean;
}) {
  const color = danger
    ? palette.red
    : tone === 'accent'
      ? palette.orange
      : palette.green;
  const labelColor = secondary
    ? tone === 'accent'
      ? palette.orangeInk
      : color
    : tone === 'accent' && !danger
      ? palette.orangeInk
      : '#fff';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      disabled={disabled || busy}
      onPress={onPress}
      style={{
        minHeight: 44,
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: secondary ? palette.border : color,
        backgroundColor: secondary ? '#fff' : color,
        opacity: disabled || busy ? 0.5 : 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
      }}
    >
      {busy && (
        <ActivityIndicator size="small" color={secondary ? color : '#fff'} />
      )}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: labelColor,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function MenuRow({
  icon: Icon,
  label,
  detail,
  onPress,
  danger = false,
  tone = 'primary',
}: {
  icon: LucideIcon;
  label: string;
  detail?: string;
  onPress: () => void;
  danger?: boolean;
  tone?: 'primary' | 'accent';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        minHeight: 56,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: danger
            ? '#fef3f2'
            : tone === 'accent'
              ? palette.orangeSurface
              : palette.greenSurface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon
          size={19}
          color={
            danger
              ? palette.red
              : tone === 'accent'
                ? palette.orangeInk
                : palette.green
          }
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            ui.body,
            { fontWeight: '500', color: danger ? palette.red : palette.ink },
          ]}
        >
          {label}
        </Text>
        {detail && <Text style={ui.muted}>{detail}</Text>}
      </View>
      <ChevronRight size={18} color={palette.muted} />
    </Pressable>
  );
}
export function Message({
  title,
  body,
  onRetry,
}: {
  title: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <Card>
      <Text style={ui.heading}>{title}</Text>
      {body && <Text style={ui.muted}>{body}</Text>}
      {onRetry && <Action secondary label="Try again" onPress={onRetry} />}
    </Card>
  );
}
export function Badge({
  label,
  neutral = false,
}: {
  label: string;
  neutral?: boolean;
}) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: neutral ? '#f1f3f2' : '#eaf7ee',
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: neutral ? palette.muted : palette.green,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
export function AmountRow({
  label,
  value,
  total = false,
}: {
  label: string;
  value: string;
  total?: boolean;
}) {
  return (
    <View style={ui.between}>
      <Text style={[total ? ui.heading : ui.muted, { flex: 1 }]}>{label}</Text>
      <Text
        style={[
          total ? ui.heading : ui.body,
          { flexShrink: 1, textAlign: 'right' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
