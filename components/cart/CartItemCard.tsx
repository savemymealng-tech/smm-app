import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { AppImage } from '@/components/ui/app-image';
import { Action, palette, ui } from '@/components/ui/screen-kit';
import { getImageSource } from '@/lib/utils';
import { formatMoney } from '@/lib/order-display';
import { cartIssue, stockAvailable } from '@/lib/cart-display';
import type { CartItem } from '@/types';
export function CartItemCard({
  item,
  busy = false,
  error,
  disabled = false,
  onRemove,
  onUpdateQuantity,
  onChoosePickup,
}: {
  item: CartItem;
  busy?: boolean;
  error?: string;
  disabled?: boolean;
  onRemove: () => void;
  onUpdateQuantity: (quantity: number) => void;
  onChoosePickup?: () => void;
}) {
  const name = item.product.name || 'Unavailable item';
  const stock = stockAvailable(item.product);
  const issue = cartIssue(item);
  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${name}`}
          onPress={() => router.push(`/product/${item.productId}` as any)}
        >
          <AppImage
            source={getImageSource(
              item.product.photo_url || item.product.images?.[0],
            )}
            style={{ width: 76, height: 76, borderRadius: 12 }}
          />
        </Pressable>
        <View style={{ flex: 1, gap: 5 }}>
          <View
            style={{ flexDirection: 'row', gap: 4, alignItems: 'flex-start' }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={() => router.push(`/product/${item.productId}` as any)}
            >
              <Text style={[ui.body, { fontWeight: '600' }]} numberOfLines={2}>
                {name}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${name}`}
              disabled={disabled}
              onPress={onRemove}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -8,
                marginRight: -8,
                opacity: disabled ? 0.4 : 1,
              }}
            >
              <Trash2 size={17} color={palette.muted} />
            </Pressable>
          </View>
          <Text style={ui.muted}>{formatMoney(item.unitPrice)} each</Text>
          <Text style={[ui.muted, { color: palette.green }]}>Pickup</Text>
        </View>
      </View>
      <View style={ui.between}>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            hitSlop={4}
            accessibilityLabel={`Decrease ${name} quantity`}
            disabled={disabled || item.quantity <= 1}
            onPress={() => onUpdateQuantity(item.quantity - 1)}
            style={[
              styles.control,
              { opacity: disabled || item.quantity <= 1 ? 0.35 : 1 },
            ]}
          >
            <Minus size={16} color={palette.ink} />
          </Pressable>
          {busy ? (
            <ActivityIndicator
              size="small"
              color={palette.green}
              style={{ width: 34 }}
            />
          ) : (
            <Text
              accessibilityLiveRegion="polite"
              style={{
                minWidth: 34,
                textAlign: 'center',
                fontWeight: '600',
                fontSize: 14,
                color: palette.ink,
              }}
            >
              {item.quantity}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            hitSlop={4}
            accessibilityLabel={`Increase ${name} quantity`}
            disabled={disabled || (stock !== null && item.quantity >= stock)}
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            style={[
              styles.control,
              {
                opacity:
                  disabled || (stock !== null && item.quantity >= stock)
                    ? 0.35
                    : 1,
              },
            ]}
          >
            <Plus size={16} color={palette.green} />
          </Pressable>
        </View>
        <Text style={ui.heading}>{formatMoney(item.totalPrice)}</Text>
      </View>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ fontSize: 12, lineHeight: 18, color: palette.red }}
        >
          {error}
        </Text>
      )}
      {!!issue && (
        <View
          style={{
            gap: 8,
            padding: 10,
            backgroundColor: '#fff8eb',
            borderRadius: 10,
          }}
        >
          <Text
            accessibilityRole="alert"
            style={{ fontSize: 12, lineHeight: 18, color: '#92400e' }}
          >
            {issue}
          </Text>
          {item.requires_fulfillment_choice && onChoosePickup && (
            <Action
              secondary
              label="Choose pickup"
              disabled={disabled}
              onPress={onChoosePickup}
            />
          )}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    backgroundColor: '#f8faf9',
  },
  control: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
