import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import {
  Dimensions,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  Platform,
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

const WelcomeHeader = () => (
  <View className="px-4 py-6 flex-row items-center justify-between">
    <View>
      <Text className="text-sm text-gray-500 font-medium uppercase tracking-wider">
        Deliver to
      </Text>
      <View className="flex-row items-center mt-0.5">
        <Text className="text-lg font-bold mr-1">Current Location</Text>
        <IconSymbol name="chevron.right" size={14} color="#000" />
      </View>
    </View>

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

const VendorCard = ({ item }: { item: Vendor }) => (
  <Pressable
    onPress={() => router.push(`/vendor/${item.id}`)}
    className="bg-white rounded-[24px] overflow-hidden shadow-sm w-[280px] mr-4 border border-gray-50"
    style={{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.03,
      shadowRadius: 12,
      elevation: 3,
    }}
  >
    <View className="relative">
      <Image
        source={{ uri: item.coverImage || item.logo }}
        className="w-full h-40"
        resizeMode="cover"
      />
      <View className="absolute top-3 right-3 bg-white/90 rounded-full px-2 py-1 flex-row items-center">
        <IconSymbol name="star.fill" size={12} color="#fbbc04" />
        <Text className="text-[12px] font-bold ml-1">{item.rating}</Text>
      </View>
    </View>
    <View className="p-4">
      <Text className="font-bold text-lg mb-1 text-gray-900" numberOfLines={1}>
        {item.name}
      </Text>
      <View className="flex-row items-center">
        <Text className="text-sm text-gray-500">
          {item.deliveryTime} mins • ${item.deliveryFee.toFixed(2)} delivery
        </Text>
      </View>
    </View>
  </Pressable>
);

const CategoryCard = ({ item }: { item: Category }) => (
  <Pressable
    onPress={() => router.push(`/category/${item.id}`)}
    className="items-center mr-6"
  >
    <View className="w-16 h-16 rounded-full bg-gray-50 items-center justify-center mb-2 overflow-hidden border border-gray-100">
      {item.icon ? (
        <Text className="text-3xl">{item.icon}</Text>
      ) : (
        <IconSymbol
          name="square.grid.2x2"
          size={24}
          color={Colors.light.tint}
        />
      )}
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
  const {
    data: featuredVendors,
    isLoading: loadingFeatured,
    refetch: refetchVendors,
  } = useVendors({ featured: true, limit: 5 });

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
    loadingFeatured || loadingTopRated || loadingCategories;

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
        <WelcomeHeader />
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
              <FlashList
                  data={categories || []}
                  renderItem={renderCategoryItem}
                  keyExtractor={(item) => item.id}
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

        <Section
          title="Featured Now"
          onSeeAll={
            featuredVendors?.length
              ? () => router.push("/explore?featured=true")
              : undefined
          }
        >
          {loadingFeatured ? (
            <View className="flex-row px-4">
              <Skeleton className="w-[280px] h-56 rounded-[24px] mr-4" />
              <Skeleton className="w-[280px] h-56 rounded-[24px]" />
            </View>
          ) : !featuredVendors?.length ? (
            <SectionEmptyState
              message="No featured stores at the moment"
              icon="bag.fill"
            />
            ) : (
                <FlashList<Vendor>
                  data={featuredVendors || []}
                  renderItem={renderVendorItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  // @ts-ignore
                  estimatedItemSize={280}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
              }}
            />
          )}
        </Section>

        <Section
          title="Top Rated"
          onSeeAll={
            topRatedVendors?.length
              ? () => router.push("/explore?sort=rating")
              : undefined
          }
        >
          {loadingTopRated ? (
            <View className="flex-row px-4">
              <Skeleton className="w-[280px] h-56 rounded-[24px] mr-4" />
              <Skeleton className="w-[280px] h-56 rounded-[24px]" />
            </View>
          ) : !topRatedVendors?.length ? (
            <SectionEmptyState
              message="No top rated stores found"
              icon="star.fill"
            />
            ) : (
                <FlashList<Vendor>
                  data={topRatedVendors || []}
                  renderItem={renderVendorItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  // @ts-ignore
                  estimatedItemSize={280}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 16,
                paddingBottom: 24,
              }}
            />
          )}
        </Section>
      </ScrollView>
    </View>
  );
}

