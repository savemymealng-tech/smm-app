import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import {
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CarouselComponent } from "@/components/ui/carousel";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { useCategories } from "@/lib/hooks/use-categories";
import { useVendors } from "@/lib/hooks/use-vendors";
import type { Category, Vendor } from "../../types";

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
      "https://plus.unsplash.com/premium_photo-1664189213349-b02ba035e4e7?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

const Header = () => (
  <View className="px-4 py-4 bg-white flex-row items-center justify-between">
    <View>
      <Text className="text-2xl font-bold">Good evening!</Text>
      <Text className="text-gray-600">What would you like to eat?</Text>
    </View>
    <Pressable
      onPress={() => router.push("/profile")}
      className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center"
    >
      <IconSymbol name="person.fill" size={20} color={Colors.light.tint} />
    </Pressable>
  </View>
);

const AdBanner = () => (
  <View className="pt-4 pb-2">
    <CarouselComponent
      data={adBanners}
      renderItem={(item: { image: string }) => (
        <Image
          source={{ uri: item.image }}
          className="w-full h-40 rounded-2xl"
          resizeMode="cover"
        />
      )}
      itemWidth={screenWidth - 32}
      autoplay
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
    <View className="flex-row items-center justify-between px-4 mb-3">
      <Text className="text-xl font-bold">{title}</Text>
      {onSeeAll && (
        <Pressable onPress={onSeeAll}>
          <Text className="text-blue-600">See All</Text>
        </Pressable>
      )}
    </View>
    {children}
  </View>
);

const VendorCard = ({ item }: { item: Vendor }) => (
  <Pressable
    onPress={() => router.push(`/vendor/${item.id}`)}
    className="bg-white rounded-2xl overflow-hidden shadow-md w-72 mr-4"
  >
    <Image
      source={{ uri: item.coverImage || item.logo }}
      className="w-full h-32"
      resizeMode="cover"
    />
    <View className="p-3">
      <Text className="font-bold text-base mb-1">{item.name}</Text>
      <View className="flex-row items-center mb-2">
        <IconSymbol name="star.fill" size={14} color={Colors.light.tint} />
        <Text className="text-sm ml-1">{item.rating}</Text>
        <Text className="text-xs text-gray-500 ml-1">
          ({item.reviewCount} reviews)
        </Text>
      </View>

      <View className="flex-row items-center">
        <IconSymbol name="clock.fill" size={14} color="#666" />
        <Text className="text-xs text-gray-600 ml-1">
          {item.deliveryTime} min
        </Text>
        <Text className="text-xs text-gray-600 mx-2">•</Text>
        <Text className="text-xs text-gray-600">
          ${item.deliveryFee.toFixed(2)} delivery
        </Text>
      </View>
    </View>
  </Pressable>
);

const CategoryCard = ({ item }: { item: Category }) => (
  <Pressable
    onPress={() => router.push(`/category/${item.id}`)}
    className="items-center justify-center bg-white rounded-xl p-3 shadow-sm w-24 h-24 mr-3"
  >
    {item.icon ? (
      <Text className="text-3xl mb-1">{item.icon}</Text>
    ) : (
      <IconSymbol name="square.grid.2x2" size={32} color={Colors.light.tint} />
    )}
    <Text className="font-medium text-xs text-center" numberOfLines={2}>
      {item.name}
    </Text>
  </Pressable>
);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    data: featuredVendors,
    isLoading: loadingFeatured,
    refetch: refetchVendors,
  } = useVendors({ featured: true, limit: 5 });

  const { data: nearbyVendors, isLoading: loadingNearby } = useVendors({
    limit: 5,
  });
  const { data: topRatedVendors, isLoading: loadingTopRated } = useVendors({
    sort: "rating",
    limit: 5,
  });

  const { data: categories, isLoading: loadingCategories } = useCategories();

  const onRefresh = () => {
    refetchVendors();
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <VendorCard item={item} />
  );

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <CategoryCard item={item} />
  );

  const isLoading =
    loadingFeatured || loadingNearby || loadingTopRated || loadingCategories;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      style={{ paddingTop: insets.top }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      <Header />
      <View className="px-4">
        <AdBanner />
      </View>

      <Section title="Categories">
        {loadingCategories ? (
          <View className="flex-row px-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="w-24 h-24 rounded-xl mr-3" />
            ))}
          </View>
        ) : (
          <FlashList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 12,
              paddingBottom: 12,
            }}
          />
        )}
      </Section>

      <Section
        title="Featured Vendors"
        onSeeAll={() => router.push("/explore?featured=true")}
      >
        {loadingFeatured ? (
          <View className="px-4">
            <Skeleton className="w-72 h-48 rounded-2xl" />
          </View>
        ) : (
          <FlashList
            data={featuredVendors}
            renderItem={renderVendorItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 16,
              paddingBottom: 12,
            }}
          />
        )}
      </Section>

      <Section title="Nearby You" onSeeAll={() => router.push("/explore")}>
        {loadingNearby ? (
          <View className="px-4">
            <Skeleton className="w-72 h-48 rounded-2xl" />
          </View>
        ) : (
          <FlashList
            data={nearbyVendors}
            renderItem={renderVendorItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 16,
              paddingBottom: 12,
            }}
          />
        )}
      </Section>

      <Section
        title="Top Rated"
        onSeeAll={() => router.push("/explore?sort=rating")}
      >
        {loadingTopRated ? (
          <View className="px-4">
            <Skeleton className="w-72 h-48 rounded-2xl" />
          </View>
        ) : (
          <FlashList
            data={topRatedVendors}
            renderItem={renderVendorItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              gap: 16,
              paddingBottom: 12,
            }}
          />
        )}
      </Section>
    </ScrollView>
  );
}
