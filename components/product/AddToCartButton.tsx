import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pickupUnavailableReason } from '@/lib/product-display';
import { formatCurrency } from '@/lib/utils';
import type { Meal } from '@/types/api';
interface Props {
  product: Meal;
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (n: number) => void;
  onAddToCart: () => void;
  isLoading?: boolean;
}
export function AddToCartButton({
  product,
  quantity,
  maxQuantity,
  onQuantityChange,
  onAddToCart,
  isLoading,
}: Props) {
  const insets = useSafeAreaInsets();
  const unavailableReason = pickupUnavailableReason(product);
  const available =
    !unavailableReason &&
    maxQuantity > 0 &&
    Number.isFinite(Number(product.price));
  return (
    <View style={[styles.footer, { paddingBottom: insets.bottom + 10 }]}>
      {!available ? (
        <Text style={styles.unavailable}>
          {maxQuantity <= 0 && product.quantity_available > 0
            ? 'All available units are already in your cart'
            : unavailableReason || 'Currently unavailable'}
        </Text>
      ) : (
        <View style={styles.row}>
          <View style={styles.quantity}>
            <Pressable
              accessibilityLabel="Decrease quantity"
              disabled={quantity <= 1 || isLoading}
              onPress={() => onQuantityChange(Math.max(1, quantity - 1))}
              style={styles.step}
            >
              <Text style={[styles.symbol, quantity <= 1 && styles.muted]}>
                −
              </Text>
            </Pressable>
            <Text style={styles.count}>{quantity}</Text>
            <Pressable
              accessibilityLabel="Increase quantity"
              disabled={quantity >= maxQuantity || isLoading}
              onPress={() =>
                onQuantityChange(Math.min(maxQuantity, quantity + 1))
              }
              style={styles.step}
            >
              <Text
                style={[styles.symbol, quantity >= maxQuantity && styles.muted]}
              >
                +
              </Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isLoading || quantity < 1 || quantity > maxQuantity}
            onPress={onAddToCart}
            style={({ pressed }) => [
              styles.add,
              pressed && { opacity: 0.85 },
              isLoading && { opacity: 0.7 },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.label}>Add to cart</Text>
                <Text style={styles.price}>
                  {formatCurrency(Number(product.price) * quantity)}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  quantity: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
    height: 44,
  },
  step: {
    width: 34,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { fontSize: 20, color: '#111827' },
  muted: { color: '#cbd5e1' },
  count: {
    minWidth: 20,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  add: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#008236',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 2,
  },
  label: { fontSize: 15, fontWeight: '700', color: '#fff' },
  price: { fontSize: 12, color: '#fff' },
  unavailable: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 6,
  },
});
