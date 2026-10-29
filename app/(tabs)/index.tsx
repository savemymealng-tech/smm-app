import { resolveAppLink } from "@/lib/deep-links";
import { MealPacks, OffersAndPacks } from "@/components/home/OffersAndPacks";
import { useHomeDiscovery } from "@/lib/hooks/use-discovery";
import { VendorCard } from "@/components/vendor/VendorCard";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAtomValue } from "jotai";
import {
  Search,
  UtensilsCrossed,
  ShoppingBasket,
  Coffee,
  Apple,
  Grid2X2,
} from "lucide-react-native";
import { BrowsingLocation } from "@/components/ui/browsing-location";
import { AppImage } from "@/components/ui/app-image";
import { Action, Message, palette, ui } from "@/components/ui/screen-kit";
import { ProductCard } from "@/components/product/ProductCard";
import {
  useBanners,
  useFeaturedCategories,
  useFeaturedProducts,
  useFeaturedVendors,
  useNearbyMeals,
  useNearbyVendors,
} from "@/lib/hooks";
import { useLocation } from "@/lib/hooks/useLocation";
import { locationRadiusAtom } from "@/lib/atoms/locationFilter";
import { getImageSource } from "@/lib/utils";
function Section({
  title,
  onAll,
  children,
}: {
  title: string;
  onAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 10 }}>
      <View style={[ui.between, { paddingHorizontal: 16 }]}>
        <Text style={ui.heading}>{title}</Text>
        {onAll && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`See all ${title.toLowerCase()}`}
            onPress={onAll}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={ui.link}>See all</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  );
}
function CategoryIcon({ name }: { name: string }) {
  const Icon = /drink|beverage|coffee/i.test(name)
    ? Coffee
    : /fruit|vegetable/i.test(name)
      ? Apple
      : /grocery|groceries|market/i.test(name)
        ? ShoppingBasket
        : /meal|food|rice|bakery|bread/i.test(name)
          ? UtensilsCrossed
          : Grid2X2;
  return <Icon size={22} color={palette.green} />;
}
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const railWidth = Math.min(208, Math.max(164, width * 0.47));
  const radius = useAtomValue(locationRadiusAtom);
  const { location, error: locationError } = useLocation();
  const [refreshing, setRefreshing] = useState(false);
  const [bannerIndex, setBannerIndex] = useState(0);
  const nearby = useNearbyMeals(
    location?.coords?.latitude ?? null,
    location?.coords?.longitude ?? null,
    radius,
    20,
  );
  const nearbyVendors = useNearbyVendors(
    location?.coords?.latitude ?? null,
    location?.coords?.longitude ?? null,
    radius,
    10,
  );
  const featured = useFeaturedProducts();
  const vendors = useFeaturedVendors();
  const categories = useFeaturedCategories();
  const banners = useBanners();
  const discovery = useHomeDiscovery();
  const hasArea = !!(location?.coords || location?.city);
  const areaTitle = location?.coords
    ? "Meals near your area"
    : `Meals in ${location?.city || "your area"}`;
  const packIds = new Set((discovery.data?.packs || []).map((pack) => pack.id));
  const nearbyIds = new Set((nearby.data || []).map((p) => p.id));
  const featuredItems = (featured.data || []).filter(
    (p) => !nearbyIds.has(p.id) && !packIds.has(p.id),
  );
  async function refresh() {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        banners.refetch(),
        discovery.refetch(),
        categories.refetch(),
        featured.refetch(),
        vendors.refetch(),
        ...(hasArea ? [nearby.refetch(), nearbyVendors.refetch()] : []),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <View
      style={{ flex: 1, paddingTop: insets.top, backgroundColor: palette.bg }}
    >
      <View
        style={{
          paddingBottom: 12,
          backgroundColor: "#fff",
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        }}
      >
        <BrowsingLocation />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Search products"
          onPress={() => router.push("/explore")}
          style={{
            marginHorizontal: 16,
            minHeight: 44,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            borderRadius: 12,
            backgroundColor: "#f2f5f3",
          }}
        >
          <Search size={18} color={palette.muted} />
          <Text style={ui.muted}>Search meals, groceries and more</Text>
        </Pressable>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24, gap: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={palette.green}
          />
        }
      >
        {!!locationError && !hasArea && (
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={ui.muted}>
              {locationError} You can also choose an area above.
            </Text>
          </View>
        )}
        {banners.isLoading ? (
          <View
            style={{
              marginHorizontal: 16,
              height: 120,
              borderRadius: 16,
              backgroundColor: "#e9eeeb",
            }}
          />
        ) : (
          !!banners.data?.length && (
            <View style={{ gap: 8 }}>
              <FlatList
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                data={banners.data}
                keyExtractor={(b) => String(b.id)}
                onMomentumScrollEnd={(event) =>
                  setBannerIndex(
                    Math.round(event.nativeEvent.contentOffset.x / width),
                  )
                }
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="View promotion"
                    disabled={!item.link_url}
                    onPress={() => {
                      const destination = resolveAppLink(item.link_url || "");
                      if (destination) router.push(destination as any);
                      else if (/^https?:\/\//.test(item.link_url || ""))
                        void Linking.openURL(item.link_url!).catch(() => {});
                    }}
                    style={{ width, paddingHorizontal: 16 }}
                  >
                    <AppImage
                      source={getImageSource(item.image_url)}
                      style={{ width: "100%", height: 120, borderRadius: 16 }}
                      resizeMode="cover"
                    />
                  </Pressable>
                )}
              />
              {banners.data.length > 1 && (
                <View
                  style={{
                    flexDirection: "row",
                    gap: 5,
                    justifyContent: "center",
                  }}
                >
                  {banners.data.map((b, index) => (
                    <View
                      key={b.id}
                      style={{
                        width: index === bannerIndex ? 16 : 5,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor:
                          index === bannerIndex ? palette.green : "#cbd6ce",
                      }}
                    />
                  ))}
                </View>
              )}
            </View>
          )
        )}
        <OffersAndPacks query={discovery} />
        {(categories.isLoading || !!categories.data?.length) && (
          <Section title="Browse categories">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            >
              {categories.isLoading
                ? [0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 74,
                        height: 82,
                        borderRadius: 12,
                        backgroundColor: "#e9eeeb",
                      }}
                    />
                  ))
                : categories.data?.map((c) => (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      onPress={() => router.push(`/category/${c.id}` as any)}
                      style={{ width: 74, gap: 7, alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 16,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: palette.greenSurface,
                        }}
                      >
                        <CategoryIcon name={c.name} />
                      </View>
                      <Text
                        style={[
                          ui.muted,
                          { textAlign: "center", fontSize: 12 },
                        ]}
                        numberOfLines={2}
                      >
                        {c.name}
                      </Text>
                    </Pressable>
                  ))}
            </ScrollView>
          </Section>
        )}
        {hasArea && (
          <Section
            title={areaTitle}
            onAll={
              nearby.data?.length
                ? () => router.push(`/explore?scope=area&reset=${Date.now()}`)
                : undefined
            }
          >
            {nearby.isLoading ? (
              <ActivityIndicator color={palette.green} />
            ) : nearby.isError ? (
              <View style={{ paddingHorizontal: 16 }}>
                <Message
                  title="Unable to load meals in this area"
                  onRetry={() => void nearby.refetch()}
                />
              </View>
            ) : nearby.data?.length ? (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  gap: 12,
                  paddingBottom: 4,
                }}
                data={nearby.data}
                keyExtractor={(i) => String(i.id)}
                renderItem={({ item }) => (
                  <View style={{ width: railWidth }}>
                    <ProductCard item={item} userLocation={location?.coords} />
                  </View>
                )}
              />
            ) : (
              <View
                style={{
                  marginHorizontal: 16,
                  padding: 16,
                  gap: 10,
                  borderWidth: 1,
                  borderColor: palette.border,
                  borderRadius: 16,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={ui.body}>
                  No pickup meals found in this area yet.
                </Text>
                <Text style={ui.muted}>
                  Choose another area above or explore meals across all areas.
                </Text>
                <Action
                  secondary
                  label="Explore all areas"
                  onPress={() =>
                    router.push(`/explore?scope=all&reset=${Date.now()}`)
                  }
                />
              </View>
            )}
          </Section>
        )}
        <MealPacks query={discovery} />
        {(featured.isLoading ||
          featuredItems.length > 0 ||
          (!hasArea && featured.isError)) && (
          <Section
            title={hasArea ? "More meals to discover" : "Featured meals"}
            onAll={() => router.push("/explore")}
          >
            {featured.isLoading ? (
              <ActivityIndicator color={palette.green} />
            ) : featured.isError ? (
              <View style={{ paddingHorizontal: 16 }}>
                <Message
                  title="Unable to load featured meals"
                  onRetry={() => void featured.refetch()}
                />
              </View>
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  gap: 12,
                  paddingBottom: 4,
                }}
                data={featuredItems}
                keyExtractor={(i) => String(i.id)}
                renderItem={({ item }) => (
                  <View style={{ width: railWidth }}>
                    <ProductCard item={item} userLocation={location?.coords} />
                  </View>
                )}
              />
            )}
          </Section>
        )}
        {!hasArea &&
          !featured.isLoading &&
          !featured.isError &&
          !featuredItems.length && (
            <View style={{ paddingHorizontal: 16 }}>
              <Message
                title="Find your next pickup"
                body="Choose an area above to see meals from local vendors."
              />
            </View>
          )}
        {hasArea && !!nearbyVendors.data?.length && (
          <Section
            title={
              location?.coords
                ? "Nearby vendors"
                : `Vendors in ${location?.city}`
            }
            onAll={() => router.push("/vendors?filter=nearby")}
          >
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              data={nearbyVendors.data}
              keyExtractor={(v) => String(v.id)}
              renderItem={({ item }) => (
                <VendorCard
                  item={item}
                  variant="rail"
                  width={railWidth}
                  userLocation={location?.coords}
                />
              )}
            />
          </Section>
        )}
        {!!vendors.data?.length && (
          <Section
            title="Featured vendors"
            onAll={() => router.push("/vendors?filter=featured")}
          >
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              data={vendors.data}
              keyExtractor={(v) => String(v.id)}
              renderItem={({ item }) => (
                <VendorCard
                  item={item}
                  variant="rail"
                  width={railWidth}
                  userLocation={location?.coords}
                />
              )}
            />
          </Section>
        )}
      </ScrollView>
    </View>
  );
}
