import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDebounce } from "use-debounce";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { useAllVendors, useFeaturedVendors, useNearbyVendors } from "@/lib/hooks";
import { useLocation } from "@/lib/hooks/useLocation";
import { getImageSource } from "@/lib/utils";
import type { FeaturedVendor, Vendor } from "@/types/api";
import { Image } from "react-native";

type FilterType = "all" | "featured" | "nearby";

const VendorGridCard = ({ item }: { item: Vendor | FeaturedVendor }) => {
  const rating = typeof item.rating === "string" ? parseFloat(item.rating) : item.rating;

  return (
    <Pressable
      onPress={() => router.push(`/vendor/${item.id}`)}
      className="bg-white rounded-2xl overflow-hidden mb-4"
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
          source={
            getImageSource(item.logo) || require("@/assets/images/default-profile.jpg")
          }
          className="w-full h-40"
          resizeMode="cover"
        />
        <View className="absolute top-3 right-3 bg-white/95 rounded-full px-3 py-1.5 flex-row items-center shadow-sm">
          <IconSymbol name="star.fill" size={12} color="#fbbf24" />
          <Text className="text-xs font-bold ml-1 text-gray-900">
            {rating > 0 ? rating.toFixed(1) : "N/A"}
          </Text>
        </View>
        {"distance" in item && item.distance && (
          <View className="absolute bottom-3 left-3 bg-[#1E8449] rounded-full px-2.5 py-1">
            <Text className="text-xs font-bold text-white">
              {item.distance} km
            </Text>
          </View>
        )}
      </View>
      <View className="p-4">
        <Text className="font-bold text-lg mb-1 text-gray-900" numberOfLines={1}>
          {item.business_name}
        </Text>
        <View className="flex-row items-center">
          <IconSymbol name="location.fill" size={12} color="#9ca3af" />
          <Text className="text-sm text-gray-500 ml-1 flex-1" numberOfLines={1}>
            {item.city || "Lagos"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default function VendorsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ filter?: string }>();
  
  const [filterType, setFilterType] = useState<FilterType>(
    (params.filter as FilterType) || "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  // Get user location
  const { location, isLoading: loadingLocation, refreshLocation } = useLocation();

  // Default city for search
  const defaultCity = "Lagos";
  const [searchCity, setSearchCity] = useState(defaultCity);

  // Fetch all vendors
  const {
    data: allVendors,
    isLoading: loadingAll,
    refetch: refetchAll,
  } = useAllVendors(100);

  // Fetch featured vendors
  const {
    data: featuredVendors,
    isLoading: loadingFeatured,
    refetch: refetchFeatured,
  } = useFeaturedVendors();

  // Fetch nearby vendors
  const {
    data: nearbyVendors,
    isLoading: loadingNearby,
    refetch: refetchNearby,
  } = useNearbyVendors(
    location?.coords.latitude ?? null,
    location?.coords.longitude ?? null,
    20, // 20km radius
    100 // limit
  );

  // Determine which vendors to display
  const displayVendors = useMemo(() => {
    let vendors: (Vendor | FeaturedVendor)[] = [];

    switch (filterType) {
      case "featured":
        vendors = featuredVendors || [];
        break;
      case "nearby":
        vendors = nearbyVendors || [];
        break;
      case "all":
      default:
        vendors = allVendors || [];
        break;
    }

    // Apply search filter if query exists
    if (debouncedSearchQuery) {
      return vendors.filter((vendor) =>
        vendor.business_name
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase())
      );
    }

    return vendors;
  }, [
    filterType,
    allVendors,
    featuredVendors,
    nearbyVendors,
    debouncedSearchQuery,
  ]);

  const isLoading =
    (filterType === "featured" && loadingFeatured) ||
    (filterType === "nearby" && loadingNearby) ||
    (filterType === "all" && loadingAll);

  const refetch = () => {
    switch (filterType) {
      case "featured":
        refetchFeatured();
        break;
      case "nearby":
        refetchNearby();
        break;
      case "all":
        refetchAll();
        break;
    }
  };

  // Update filter when query param changes
  useEffect(() => {
    if (params.filter && params.filter !== filterType) {
      setFilterType(params.filter as FilterType);
    }
  }, [params.filter]);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="bg-white border-b border-gray-100"
        style={{
          paddingTop: insets.top,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="px-4 py-4 flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="mr-3">
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </Pressable>
          <Text className="text-xl font-bold flex-1">Stores</Text>
        </View>

        {/* Search Bar */}
        <View className="px-4 pb-4">
          <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-3">
            <IconSymbol
              name="magnifyingglass"
              size={20}
              color={Colors.light.icon}
            />
            <TextInput
              placeholder="Search stores..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-base"
              placeholderTextColor="#6b7280"
              style={{ color: "#111827" }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <IconSymbol name="xmark.circle.fill" size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row px-4 pb-4 space-x-2">
          <Pressable
            onPress={() => setFilterType("all")}
            className={`flex-1 py-2.5 rounded-full items-center ${
              filterType === "all" ? "bg-[#1E8449]" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-semibold text-sm ${
                filterType === "all" ? "text-white" : "text-gray-700"
              }`}
            >
              All Stores
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFilterType("featured")}
            className={`flex-1 py-2.5 rounded-full items-center mx-2 ${
              filterType === "featured" ? "bg-[#1E8449]" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-semibold text-sm ${
                filterType === "featured" ? "text-white" : "text-gray-700"
              }`}
            >
              Featured
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (!location) {
                refreshLocation();
              }
              setFilterType("nearby");
            }}
            className={`flex-1 py-2.5 rounded-full items-center ${
              filterType === "nearby" ? "bg-[#1E8449]" : "bg-gray-100"
            }`}
          >
            <Text
              className={`font-semibold text-sm ${
                filterType === "nearby" ? "text-white" : "text-gray-700"
              }`}
            >
              Nearby
            </Text>
          </Pressable>
        </View>

        {/* Results Count */}
        <View className="px-4 pb-3">
          <Text className="text-sm text-gray-500">
            {isLoading ? "Loading..." : `${displayVendors.length} stores found`}
          </Text>
        </View>
      </View>

      {/* Vendors Grid */}
      {isLoading ? (
        <ScrollView className="flex-1 px-4 pt-4">
          <View className="flex-row flex-wrap justify-between">
            {[...Array(6)].map((_, i) => (
              <View key={i} className="w-[48%]">
                <Skeleton className="w-full h-56 rounded-2xl mb-4" />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : displayVendors.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <IconSymbol name="storefront" size={64} color="#9ca3af" />
          <Text className="text-gray-500 text-center mt-4 text-lg font-medium">
            {filterType === "nearby"
              ? location
                ? "No stores found nearby"
                : "Enable location to find nearby stores"
              : filterType === "featured"
              ? "No featured stores at the moment"
              : "No stores available"}
          </Text>
          {filterType === "nearby" && !location && (
            <Pressable
              onPress={refreshLocation}
              className="mt-4 bg-[#1E8449] px-6 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Enable Location</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={refetch}
              tintColor={Colors.light.tint}
            />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="flex-row flex-wrap justify-between">
            {displayVendors.map((vendor) => (
              <View key={vendor.id} className="w-[48%]">
                <VendorGridCard item={vendor} />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
