import { productDiscount } from '@/lib/product-display';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { AppImage } from '@/components/ui/app-image';
import { palette } from '@/components/ui/screen-kit';
import { formatMoney } from '@/lib/order-display';
import {
  calculateDistance,
  formatDistance,
  formatTime12Hour,
  getEffectivePickupDay,
  getImageSource,
} from '@/lib/utils';
import type { Meal } from '@/types/api';
export function ProductCard({
  item,
  userLocation,
}: {
  item: Meal;
  userLocation?: { latitude: number; longitude: number } | null;
}) {
  const price = Number(item.price),
    original = Number(item.original_price);
  const discount = productDiscount(item.price, item.original_price);
  const expiry = item.expiry_date ? new Date(item.expiry_date).getTime() : NaN;
  const unavailable =
    item.is_available === false ||
    item.quantity_available <= 0 ||
    (Number.isFinite(expiry) && expiry < Date.now()) ||
    item.available_for_pickup === false;
  const rating = Number(item.vendor?.rating);
  const hasRating = Number.isFinite(rating) && rating > 0 && rating <= 5;
  const lowStock = item.quantity_available > 0 && item.quantity_available <= 5;
  const lat = Number(item.vendor?.latitude),
    lng = Number(item.vendor?.longitude);
  const distance =
    userLocation &&
    item.vendor?.latitude != null &&
    item.vendor?.longitude != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng)
      ? formatDistance(
          calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            lat,
            lng,
          ),
        )
      : null;
  const window =
    item.pickup_start_time && item.pickup_end_time
      ? `${formatTime12Hour(item.pickup_start_time)}–${formatTime12Hour(item.pickup_end_time)}`
      : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${formatMoney(price)}${unavailable ? ', currently unavailable' : ''}. View pickup details`}
      onPress={() => router.push(`/product/${item.id}` as any)}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.88 : 1 }]}
    >
      <View style={{ aspectRatio: 4 / 3, backgroundColor: '#edf1ee' }}>
        <AppImage
          source={getImageSource(item.photo_url)}
          style={{
            width: '100%',
            height: '100%',
            opacity: unavailable ? 0.55 : 1,
          }}
          resizeMode="cover"
        />
        {discount.hasDiscount && (
          <View style={styles.offer}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 11,
                lineHeight: 15,
                fontWeight: '700',
                color: palette.orangeInk,
              }}
            >
              {discount.label}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.vendor} numberOfLines={1}>
          {item.vendor?.business_name || 'Pickup vendor'}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            gap: 5,
          }}
        >
          <Text style={styles.price}>{formatMoney(price)}</Text>
          {discount.hasDiscount && (
            <Text style={styles.original}>{formatMoney(original)}</Text>
          )}
        </View>
        <View style={{ gap: 2, minHeight: 34 }}>
          <Text style={styles.pickup}>
            {window
              ? `Pickup ${getEffectivePickupDay(item.pickup_day, item.pickup_end_time).toLowerCase()}`
              : 'Pickup'}
          </Text>
          <Text style={styles.secondary} numberOfLines={1}>
            {window || 'View collection details'}
          </Text>
        </View>
        {!!distance && <Text style={styles.secondary}>{distance} away</Text>}
        <View style={styles.bottom}>
          {unavailable ? (
            <Text
              style={{
                fontSize: 11,
                lineHeight: 16,
                fontWeight: '600',
                color: palette.red,
              }}
            >
              Unavailable
            </Text>
          ) : (
            <>
              {hasRating && (
                <View
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                >
                  <Star
                    size={11}
                    color={palette.orange}
                    fill={palette.orange}
                  />
                  <Text
                    accessibilityLabel={`Vendor rating ${rating.toFixed(1)} out of 5`}
                    style={styles.secondary}
                  >
                    Vendor {rating.toFixed(1)}
                  </Text>
                </View>
              )}
              {lowStock && (
                <Text
                  style={{
                    fontSize: 11,
                    lineHeight: 16,
                    fontWeight: '600',
                    color: palette.orangeInk,
                  }}
                >
                  {item.quantity_available} left
                </Text>
              )}
            </>
          )}
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#193c28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.025,
    shadowRadius: 4,
    elevation: 1,
  },
  body: { flex: 1, padding: 10, gap: 7 },
  name: {
    minHeight: 36,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    color: palette.ink,
  },
  vendor: { fontSize: 12, lineHeight: 16, color: palette.muted },
  price: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: palette.ink,
  },
  original: {
    fontSize: 11,
    lineHeight: 16,
    color: '#77837c',
    textDecorationLine: 'line-through',
  },
  pickup: {
    fontSize: 12,
    lineHeight: 16,
    color: palette.green,
    fontWeight: '600',
  },
  secondary: { fontSize: 11, lineHeight: 16, color: palette.muted },
  bottom: {
    minHeight: 16,
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 5,
    flexWrap: 'wrap',
  },
  offer: {
    position: 'absolute',
    zIndex: 2,
    elevation: 2,
    minWidth: 56,
    minHeight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    left: 8,
    bottom: 8,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: palette.orange,
  },
});
