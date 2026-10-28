import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  BadgeCheck,
  ChevronRight,
  MapPin,
  ShoppingBag,
  Sparkles,
  Star,
} from 'lucide-react-native';
import { AppImage } from '@/components/ui/app-image';
import { palette } from '@/components/ui/screen-kit';
import { getImageSource, formatDistance } from '@/lib/utils';
import {
  vendorDistanceMeters,
  vendorFlags,
  vendorRating,
} from '@/lib/vendor-display';
import type { Vendor as ApiVendor } from '@/types/api';
import type { Vendor as LocalVendor } from '@/types';
type Props = {
  item: ApiVendor | LocalVendor;
  userLocation?: { latitude: number; longitude: number } | null;
  variant?: 'rail' | 'list';
  width?: number;
};
export function VendorCard({
  item,
  userLocation,
  variant = 'rail',
  width,
}: Props) {
  const rail = variant === 'rail';
  const rating = vendorRating(item.rating);
  const distance = vendorDistanceMeters(item, userLocation);
  const flags = vendorFlags(item);
  const name = item.business_name || 'Pickup vendor';
  const city =
    'city' in item && typeof item.city === 'string' ? item.city : undefined;
  const logo = (
    <View
      style={[
        styles.logoFrame,
        { width: rail ? 56 : 68, height: rail ? 56 : 68 },
      ]}
    >
      <AppImage
        source={getImageSource(item.logo)}
        fallbackSource={require('@/assets/images/default-profile.jpg')}
        style={{ width: '100%', height: '100%', borderRadius: 12 }}
        resizeMode="contain"
      />
    </View>
  );
  const featured = flags.featured ? (
    <View style={styles.featured}>
      <Sparkles size={11} color={palette.orangeInk} />
      <Text style={styles.featuredText}>Featured</Text>
    </View>
  ) : null;
  const identity = (
    <View style={{ flex: rail ? undefined : 1, gap: 5, minWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5 }}>
        <Text
          numberOfLines={2}
          style={[styles.name, { flex: 1, minHeight: rail ? 40 : undefined }]}
        >
          {name}
        </Text>
        {flags.verified && (
          <BadgeCheck
            accessibilityLabel="Verified vendor"
            size={17}
            color={palette.green}
            style={{ marginTop: 2 }}
          />
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
        <MapPin size={12} color={palette.green} />
        <Text numberOfLines={1} style={[styles.secondary, { flex: 1 }]}>
          {city || 'View pickup location'}
        </Text>
      </View>
    </View>
  );
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${name}${flags.featured ? ', featured vendor' : ''}`}
      onPress={() => router.push(`/vendor/${item.id}` as any)}
      style={({ pressed }) => [
        styles.card,
        rail ? { width: width ?? 184 } : null,
        { opacity: pressed ? 0.86 : 1 },
      ]}
    >
      {rail ? (
        <>
          <View style={styles.top}>
            {logo}
            {featured}
          </View>
          {identity}
        </>
      ) : (
        <>
          <View
            style={[
              styles.top,
              { justifyContent: 'flex-start', alignItems: 'center', gap: 12 },
            ]}
          >
            {logo}
            {identity}
          </View>
          {featured}
        </>
      )}
      <View style={styles.meta}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {rating ? (
            <>
              <Star size={13} color={palette.orange} fill={palette.orange} />
              <Text style={styles.rating}>{rating}</Text>
              <Text style={styles.secondary}>rating</Text>
            </>
          ) : (
            <Text style={styles.secondary}>No rating yet</Text>
          )}
        </View>
        {distance !== null && (
          <Text style={styles.secondary}>{formatDistance(distance)} away</Text>
        )}
      </View>
      <View style={styles.footer}>
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
          <ShoppingBag size={12} color={palette.green} />
          <Text style={{ fontSize: 12, lineHeight: 17, color: palette.green }}>
            Pickup
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text
            style={{
              fontSize: 12,
              lineHeight: 17,
              fontWeight: '600',
              color: palette.green,
            }}
          >
            View vendor
          </Text>
          <ChevronRight size={15} color={palette.green} />
        </View>
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 12,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#193c28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.025,
    shadowRadius: 4,
    elevation: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  logoFrame: {
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e6ebe8',
    backgroundColor: '#fafcfb',
    overflow: 'hidden',
  },
  name: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: palette.ink },
  secondary: { fontSize: 12, lineHeight: 17, color: palette.muted },
  rating: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: palette.ink,
  },
  meta: {
    minHeight: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  featured: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: palette.orangeSurface,
  },
  featuredText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    color: palette.orangeInk,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
});
