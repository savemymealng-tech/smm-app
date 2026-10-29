import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, Tag } from 'lucide-react-native';
import { AppImage } from '@/components/ui/app-image';
import { ProductCard } from '@/components/product/ProductCard';
import { palette, ui } from '@/components/ui/screen-kit';
import { getImageSource } from '@/lib/utils';
import { offerDisplay } from '@/lib/offer-display';
import type { useHomeDiscovery } from '@/lib/hooks/use-discovery';

export function OffersAndPacks({
  query,
}: {
  query: ReturnType<typeof useHomeDiscovery>;
}) {
  const { width: screenWidth, fontScale } = useWindowDimensions();
  const offers = query.data?.offers || [];
  const rail = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);
  const cardWidth =
    offers.length === 1 ? screenWidth - 32 : Math.min(320, screenWidth - 52);
  const interval = cardWidth + 12;
  const cardHeight = Math.ceil(84 * Math.max(1, fontScale));
  const identity = offers.map((offer) => `${offer.kind}-${offer.id}`).join('|');
  useEffect(() => {
    setActive(0);
    rail.current?.scrollTo({ x: 0, animated: false });
  }, [identity, cardWidth]);
  if (query.isLoading)
    return (
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <Text style={ui.heading}>Offers for you</Text>
        <View
          style={[
            styles.card,
            {
              height: cardHeight,
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}
        >
          <ActivityIndicator
            color={palette.green}
            accessibilityLabel="Loading offers"
          />
        </View>
      </View>
    );
  if (query.isError)
    return (
      <View
        style={{
          marginHorizontal: 16,
          padding: 16,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: palette.border,
          backgroundColor: '#fff',
          gap: 5,
        }}
      >
        <Text style={ui.heading}>Offers are taking a little longer</Text>
        <Text style={ui.muted}>
          Try again to see the latest offers and meal packs.
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => void query.refetch()}
          style={{
            alignSelf: 'flex-start',
            minHeight: 44,
            justifyContent: 'center',
          }}
        >
          <Text style={ui.link}>Try again</Text>
        </Pressable>
      </View>
    );
  return (
    <View style={{ gap: 22 }}>
      {!!offers.length && (
        <View style={{ gap: 12 }}>
          <View style={[ui.between, { paddingHorizontal: 16 }]}>
            <View style={{ gap: 3 }}>
              <Text style={ui.heading}>Offers for you</Text>
            </View>
            {offers.length > 1 && (
              <Text
                accessibilityLabel={`Offer ${Math.min(active + 1, offers.length)} of ${offers.length}`}
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: palette.muted,
                }}
              >
                {Math.min(active + 1, offers.length)} / {offers.length}
              </Text>
            )}
          </View>
          <ScrollView
            ref={rail}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={interval}
            snapToAlignment="start"
            disableIntervalMomentum
            onMomentumScrollEnd={(event) =>
              setActive(
                Math.max(
                  0,
                  Math.min(
                    offers.length - 1,
                    Math.round(event.nativeEvent.contentOffset.x / interval),
                  ),
                ),
              )
            }
            contentContainerStyle={{
              paddingLeft: 16,
              paddingRight: Math.max(16, screenWidth - cardWidth - 16),
              paddingVertical: 2,
              gap: 12,
            }}
          >
            {offers.map((offer, index) => {
              const display = offerDisplay(offer);
              return (
                <Pressable
                  key={`${offer.kind}-${offer.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${display.saving}. ${offer.title}. ${display.audience}. ${display.detail}. View offer ${index + 1} of ${offers.length}.`}
                  onPress={() => router.push(offer.destination as never)}
                  style={({ pressed }) => [
                    styles.card,
                    {
                      width: cardWidth,
                      height: cardHeight,
                      opacity: pressed ? 0.86 : 1,
                    },
                  ]}
                >
                  {!!offer.image_url ? (
                    <AppImage
                      source={getImageSource(offer.image_url)}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.thumbnail,
                        { alignItems: 'center', justifyContent: 'center' },
                      ]}
                    >
                      <Tag size={23} color={palette.green} strokeWidth={1.6} />
                    </View>
                  )}
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                        style={{
                          flexShrink: 1,
                          fontSize: 19,
                          lineHeight: 23,
                          fontWeight: '800',
                          color: palette.green,
                        }}
                      >
                        {display.saving}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          flexShrink: 1,
                          fontSize: 9,
                          color: palette.muted,
                        }}
                      >
                        {display.audience}
                      </Text>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        lineHeight: 16,
                        fontWeight: '600',
                        color: palette.ink,
                      }}
                    >
                      {offer.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 10,
                        lineHeight: 14,
                        color: palette.muted,
                      }}
                    >
                      {display.detail}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: palette.orangeSurface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ArrowRight size={13} color={palette.orangeInk} />
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          {offers.length > 1 && (
            <View
              style={{ flexDirection: 'row', justifyContent: 'center', gap: 2 }}
            >
              {offers.map((offer, index) => (
                <Pressable
                  key={`${offer.kind}-${offer.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Show offer ${index + 1} of ${offers.length}`}
                  accessibilityState={{ selected: active === index }}
                  onPress={() => {
                    setActive(index);
                    rail.current?.scrollTo({
                      x: index * interval,
                      animated: true,
                    });
                  }}
                  style={{
                    minWidth: 28,
                    minHeight: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      height: 5,
                      width: active === index ? 20 : 5,
                      borderRadius: 3,
                      backgroundColor:
                        active === index ? palette.green : '#d4ded7',
                    }}
                  />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

    </View>
  );
}
export function MealPacks({ query }: { query: ReturnType<typeof useHomeDiscovery> }) {
  if (!query.data?.packs.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <View style={[ui.between, { paddingHorizontal: 16 }]}>
        <Text style={ui.heading}>Meal packs</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/packs' as never)}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={ui.link}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {query.data.packs.map((pack) => (
          <View key={pack.id} style={{ width: 190 }}>
            <ProductCard item={pack} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#fff',
    shadowColor: '#193c28',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.025,
    shadowRadius: 4,
    elevation: 1,
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: palette.greenSurface,
  },
});
