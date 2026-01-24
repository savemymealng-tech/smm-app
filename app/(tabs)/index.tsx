import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import {
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CarouselComponent } from "@/components/ui/carousel";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { useFeaturedCategories, useFeaturedProducts, useFeaturedVendors, useNearbyVendors } from "@/lib/hooks";
import { useLocation } from "@/lib/hooks/useLocation";
import type { FeaturedCategory, FeaturedProduct, FeaturedVendor, Vendor } from "../../types/api";

const { width: screenWidth } = Dimensions.get("window");

const adBanners = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=2672&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=2881&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/premium_photo-1664189213349-b02ba035e4e7?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const SearchBar = () => (
  <View className="px-4 mb-4">
    <Pressable
      onPress={() => router.push("/explore")}
      className="flex-row items-center bg-white rounded-full px-4 py-3 shadow-sm border border-gray-100"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <IconSymbol name="magnifyingglass" size={20} color={Colors.light.icon} />
      <Text className="ml-3 text-gray-400 text-base flex-1">
        Search for food, groceries...
      </Text>
      <View className="w-px h-6 bg-gray-200 mx-2" />
      <IconSymbol name="location.fill" size={18} color={Colors.light.tint} />
    </Pressable>
  </View>
);

const WelcomeHeader = ({
  address,
  isLoading,
  onPress
}: {
  address?: string;
  isLoading?: boolean;
  onPress?: () => void;
}) => (
  <Pressable onPress={onPress} className="px-4 py-6 flex-row items-center justify-between">
    <View className="flex-1">
      <Text className="text-sm text-gray-500 font-medium uppercase tracking-wider">
        Deliver to
      </Text>
      <View className="flex-row items-center mt-0.5">
        {isLoading ? (
          <Text className="text-lg font-bold mr-1 text-gray-400">Getting location...</Text>
        ) : (
          <Text className="text-lg font-bold mr-1 flex-1" numberOfLines={1}>
            {address || 'Current Location'}
          </Text>
        )}
        <IconSymbol name="chevron.right" size={14} color="#000" />
      </View>
    </View>
  </Pressable>
);

const NearbyVendorCard = ({ item }: { item: Vendor }) => (
  <View style={{ width: 165, marginRight: 12 }}>
    <Pressable
      onPress={() => router.push(`/vendor/${item.id}`)}
      className="bg-white rounded-3xl overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View className="relative">
        <Image
          source={item.logo ? { uri: item.logo } : require('@/assets/images/default-profile.jpg')}
          className="w-full h-[140px]"
          resizeMode="cover"
        />
        <View className="absolute top-2.5 right-2.5 bg-white/95 rounded-full px-2.5 py-1 flex-row items-center shadow-sm">
          <IconSymbol name="star.fill" size={11} color="#fbbf24" />
          <Text className="text-[11px] font-bold ml-1 text-gray-900">
            {parseFloat(item.rating || '0').toFixed(1)}
          </Text>
        </View>
        {item.distance && (
          <View className="absolute bottom-2.5 left-2.5 bg-[#1E8449] rounded-full px-2 py-0.5">
            <Text className="text-[10px] font-bold text-white">{item.distance} km</Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="font-bold text-base mb-0.5 text-gray-900" numberOfLines={1}>
          {item.business_name}
        </Text>
        <View className="flex-row items-center mb-1">
          <IconSymbol name="location.fill" size={11} color="#9ca3af" />
          <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
            {item.city || 'Lagos'}
          </Text>
        </View>
      </View>
    </Pressable>
  </View>
);

const AdBanner = () => (
  <View className="mb-6">
    <CarouselComponent
      data={adBanners}
      renderItem={(item: { image: string }) => (
        <View className="px-4">
          <Image
            source={{ uri: item.image }}
            className="w-full h-44 rounded-3xl"
            resizeMode="cover"
          />
        </View>
      )}
      itemWidth={screenWidth}
      autoplay
      loop
      autoplayInterval={4000}
    />
  </View>
);

const Section = ({
  title,
  onSeeAll,
  children,
}: {
  title: string;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) => (
  <View className="mb-8">
    <View className="flex-row items-center justify-between px-4 mb-4">
      <Text className="text-xl font-bold text-gray-900">{title}</Text>
      {onSeeAll && (
        <Pressable
          onPress={onSeeAll}
          className="bg-primary/10 px-3 py-1 rounded-full"
        >
          <Text className="text-primary font-semibold text-sm">View all</Text>
        </Pressable>
      )}
    </View>
    {children}
  </View>
);

const SectionEmptyState = ({
  message,
  icon,
}: {
  message: string;
  icon?: any;
}) => (
  <View className="px-4 py-8 items-center justify-center bg-gray-50/50 rounded-[24px] mx-4 border border-dashed border-gray-200">
    <IconSymbol
      name={icon || "square.grid.2x2"}
      size={32}
      color="#9ca3af"
    />
    <Text className="text-gray-500 text-sm mt-2 font-medium">{message}</Text>
  </View>
);

const VendorCard = ({ item }: { item: FeaturedVendor }) => (
  <View style={{ width: 165, marginRight: 12 }}>
    <Pressable
      onPress={() => router.push(`/vendor/${item.id}`)}
      className="bg-white rounded-3xl overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
    <View className="relative">
      <Image
        source={item.logo ? { uri: item.logo } : require('@/assets/images/default-profile.jpg')}
        className="w-full h-[140px]"
        resizeMode="cover"
      />
        <View className="absolute top-2.5 right-2.5 bg-white/95 rounded-full px-2.5 py-1 flex-row items-center shadow-sm">
        <IconSymbol name="star.fill" size={11} color="#fbbf24" />
          <Text className="text-[11px] font-bold ml-1 text-gray-900">
          {parseFloat(item.rating || '0').toFixed(1)}
        </Text>
      </View>
    </View>
    <View className="p-3">
        <Text className="font-bold text-base mb-0.5 text-gray-900" numberOfLines={1}>
        {item.business_name}
      </Text>
      <View className="flex-row items-center mb-1">
        <IconSymbol name="location.fill" size={11} color="#9ca3af" />
          <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>
          {item.city || 'Lagos'}
        </Text>
      </View>
      {item.distance && (
          <Text className="text-[11px] text-gray-400">
          {item.distance}
        </Text>
      )}
    </View>
    </Pressable>
  </View>
);

const ProductCard = ({ item }: { item: FeaturedProduct }) => {
  const price = parseFloat(item.price);
  const originalPrice = item.original_price ? parseFloat(item.original_price) : null;
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount ? Math.round(((originalPrice! - price) / originalPrice!) * 100) : 0;
  
  return (
    <View style={{ width: 165, marginRight: 12 }}>
      <Pressable
        onPress={() => router.push(`/product/${item.id}`)}
        className="bg-white rounded-3xl overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 3,
        }}
      >
      <View className="relative">
        <Image
          source={item.photo_url ? { uri: item.photo_url } : require('@/assets/images/default-product.jpg')}
          className="w-full h-[140px]"
          resizeMode="cover"
        />
        {hasDiscount && (
          <View className="absolute top-2.5 left-2.5 bg-red-500 rounded-full px-2 py-0.5">
            <Text className="text-[10px] font-bold text-white">{discountPercent}% OFF</Text>
          </View>
        )}
        <View className="absolute top-2.5 right-2.5 bg-white/95 dark:bg-gray-800/95 rounded-full px-2.5 py-1 flex-row items-center shadow-sm">
          <IconSymbol name="star.fill" size={11} color="#fbbf24" />
          <Text className="text-[11px] font-bold ml-1 text-gray-900 dark:text-white">
            {parseFloat(item.vendor?.rating || '4.5').toFixed(1)}
          </Text>
        </View>
        {!item.is_available && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center">
            <Text className="text-white font-semibold text-xs">Sold Out</Text>
          </View>
        )}
      </View>
      <View className="p-3">
          <Text className="font-bold text-base mb-1 text-gray-900" numberOfLines={1}>
          {item.name}
        </Text>
        <View className="flex-row items-center justify-between">
          <View>
              <Text className="text-sm font-bold text-[#1E8449]">
              ₦{price.toFixed(0)}
            </Text>
            {hasDiscount && (
              <Text className="text-[11px] text-gray-400 line-through">
                ₦{originalPrice?.toFixed(0)}
              </Text>
            )}
          </View>
          {item.quantity_available > 0 && item.quantity_available < 10 && (
              <Text className="text-[10px] text-amber-600 font-medium">
              {item.quantity_available} left
            </Text>
          )}
        </View>
      </View>
      </Pressable>
    </View>
  );
};

const CategoryCard = ({ item }: { item: FeaturedCategory }) => (
  <Pressable
    onPress={() => router.push(`/category/${item.id}`)}
    className="items-center mr-6"
  >
    <View className="w-16 h-16 rounded-full bg-gray-50 items-center justify-center mb-2 overflow-hidden border border-gray-100">
      <IconSymbol
        name="square.grid.2x2"
        size={24}
        color={Colors.light.tint}
      />
    </View>
    <Text
      className="font-medium text-[13px] text-gray-700 text-center"
      numberOfLines={1}
    >
      {item.name}
    </Text>
  </Pressable>
);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  // Location hook for nearby vendors
  const {
    location,
    isLoading: loadingLocation,
    refreshLocation,
  } = useLocation();

  // Nearby vendors based on user location
  const {
    data: nearbyVendors,
    isLoading: loadingNearby,
    refetch: refetchNearby,
  } = useNearbyVendors(
    location?.coords.latitude ?? null,
    location?.coords.longitude ?? null,
    10, // 10km radius
    10  // limit to 10 vendors
  );

  const {
    data: featuredVendors,
    isLoading: loadingFeatured,
    refetch: refetchVendors,
  } = useFeaturedVendors();

  const {
    data: featuredProducts,
    isLoading: loadingProducts,
    refetch: refetchProducts,
  } = useFeaturedProducts();

  const { 
    data: categories, 
    isLoading: loadingCategories,
    refetch: refetchCategories,
  } = useFeaturedCategories();

  const onRefresh = () => {
    refetchVendors();
    refetchProducts();
    refetchCategories();
    if (location) {
      refetchNearby();
    } else {
      refreshLocation();
    }
  };

  const renderVendorItem = ({ item }: { item: FeaturedVendor }) => (
    <VendorCard item={item} />
  );

  const renderNearbyVendorItem = ({ item }: { item: Vendor }) => (
    <NearbyVendorCard item={item} />
  );

  const renderProductItem = ({ item }: { item: FeaturedProduct }) => (
    <ProductCard item={item} />
  );

  const renderCategoryItem = ({ item }: { item: FeaturedCategory }) => (
    <CategoryCard item={item} />
  );

  const isLoading =
    loadingFeatured || loadingProducts || loadingCategories;

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        style={{ paddingTop: insets.top }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={onRefresh}
            tintColor={Colors.light.tint}
          />
        }
      >
        <WelcomeHeader
          address={location?.address}
          isLoading={loadingLocation}
          onPress={refreshLocation}
        />
        <SearchBar />
        <AdBanner />

        <Section title="Categories">
          {loadingCategories ? (
            <View className="flex-row px-4">
              {[...Array(5)].map((_, i) => (
                <View key={i} className="items-center mr-6">
                  <Skeleton className="w-16 h-16 rounded-full mb-2" />
                  <Skeleton className="w-12 h-3 rounded-full" />
                </View>
              ))}
            </View>
          ) : !categories?.length ? (
            <SectionEmptyState message="No categories available" />
            ) : (
              <FlashList<FeaturedCategory>
                  data={categories || []}
                  renderItem={renderCategoryItem}
                  keyExtractor={(item) => String(item.id)}
                  horizontal
                  // @ts-ignore
                  estimatedItemSize={80}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
              }}
            />
          )}
        </Section>

        {/* Nearby Vendors Section - Only show if we have location */}
        {(location || loadingNearby) && (
          <Section
            title="Nearby Stores"
            onSeeAll={
              nearbyVendors?.length
                ? () => router.push("/explore")
                : undefined
            }
          >
            {loadingNearby || loadingLocation ? (
              <View className="flex-row px-4">
                <Skeleton className="w-[165px] h-[200px] rounded-3xl mr-3" />
                <Skeleton className="w-[165px] h-[200px] rounded-3xl mr-3" />
                <Skeleton className="w-[165px] h-[200px] rounded-3xl" />
              </View>
            ) : !nearbyVendors?.length ? (
              <SectionEmptyState
                message="No stores found nearby"
                icon="location.slash.fill"
              />
            ) : (
              <FlashList<Vendor>
                data={nearbyVendors || []}
                renderItem={renderNearbyVendorItem}
                keyExtractor={(item) => String(item.id)}
                horizontal
                // @ts-ignore
                estimatedItemSize={165}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingRight: 32,
                }}
              />
            )}
          </Section>
        )}

        <Section
          title="Featured Stores"
          onSeeAll={
            featuredVendors?.length
              ? () => router.push("/explore?featured=true")
              : undefined
          }
        >
          {loadingFeatured ? (
            <View className="flex-row px-4">
              <Skeleton className="w-[165px] h-[200px] rounded-3xl mr-3" />
              <Skeleton className="w-[165px] h-[200px] rounded-3xl mr-3" />
              <Skeleton className="w-[165px] h-[200px] rounded-3xl" />
            </View>
          ) : !featuredVendors?.length ? (
            <SectionEmptyState
              message="No featured stores at the moment"
              icon="bag.fill"
            />
            ) : (
                <FlashList<FeaturedVendor>
                  data={featuredVendors || []}
                  renderItem={renderVendorItem}
                  keyExtractor={(item) => String(item.id)}
                  horizontal
                  // @ts-ignore
                  estimatedItemSize={165}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingRight: 32,
              }}
            />
          )}
        </Section>

        <Section
          title="Featured Products"
          onSeeAll={
            featuredProducts?.length
              ? () => router.push("/explore?sort=rating")
              : undefined
          }
        >
          {loadingProducts ? (
            <View className="flex-row px-4">
              <Skeleton className="w-[165px] h-[220px] rounded-3xl mr-3" />
              <Skeleton className="w-[165px] h-[220px] rounded-3xl mr-3" />
              <Skeleton className="w-[165px] h-[220px] rounded-3xl" />
            </View>
          ) : !featuredProducts?.length ? (
            <SectionEmptyState
              message="No featured products found"
              icon="star.fill"
            />
            ) : (
                <FlashList<FeaturedProduct>
                  data={featuredProducts || []}
                  renderItem={renderProductItem}
                  keyExtractor={(item) => String(item.id)}
                  horizontal
                  // @ts-ignore
                  estimatedItemSize={165}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                    paddingRight: 32,
                paddingBottom: 24,
              }}
            />
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

