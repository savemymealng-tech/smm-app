import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useDebounce } from "use-debounce";

import {
  EmptyState,
  FilterPanel,
  ProductsSection,
  VendorsSection,
} from "@/components/explore";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { useBrowseMealsInfinite, useFeaturedCategories, useFeaturedVendors, useNearbyVendors } from "@/lib/hooks";
import { useLocation } from "@/lib/hooks/useLocation";
import type { Vendor } from "@/types";
import type { FeaturedVendor } from "@/types/api";

export default function ExploreScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    category?: string;
    nearby_vendors?: string;
    all_vendors?: string;
    all_products?: string;
  }>();

  // Determine view mode
  const viewMode = params.nearby_vendors === "true" 
    ? "nearby_vendors" 
    : params.all_vendors === "true" 
    ? "all_vendors" 
    : "products";

  const [searchQuery, setSearchQuery] = useState(params.q || "");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.category || null
  );
  const [minRating, setMinRating] = useState<number | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);

  const { data: categories } = useFeaturedCategories();

  // Get location for nearby vendors
  const { location } = useLocation();

  // Fetch featured vendors for "all vendors" view
  const { 
    data: allVendors, 
    isLoading: loadingAllVendors, 
    refetch: refetchAllVendors 
  } = useFeaturedVendors();

  // Fetch nearby vendors for "nearby vendors" view
  const {
    data: nearbyVendors,
    isLoading: loadingNearbyVendors,
    refetch: refetchNearbyVendors,
  } = useNearbyVendors(
    location?.coords.latitude ?? null,
    location?.coords.longitude ?? null,
    10,
    50
  );

  const browseParams = useMemo(() => {
    const params: any = {};
    
    if (debouncedSearchQuery) {
      params.search = debouncedSearchQuery;
    }
    if (selectedCategory) {
      // Convert category to number if it's a string
      params.category_id = typeof selectedCategory === 'string' ? Number(selectedCategory) : selectedCategory;
    }
    if (minRating) {
      params.vendor_rating_min = minRating;
    }
    if (minPrice !== null) {
      params.min_price = minPrice;
    }
    if (maxPrice !== null) {
      params.max_price = maxPrice;
    }
    if (dietaryPreferences.length > 0) {
      params.dietary_preferences = dietaryPreferences.join(',');
    }
    
    return params;
  }, [debouncedSearchQuery, selectedCategory, minRating, minPrice, maxPrice, dietaryPreferences]);

  const {
    data: mealsData,
    isLoading: loadingMeals,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchMeals,
    isRefetching,
  } = useBrowseMealsInfinite(browseParams);

  // Flatten all pages into a single array
  const meals = useMemo(() => {
    return mealsData?.pages.flatMap(page => page.data) || [];
  }, [mealsData]);
  
  // Use actual product count instead of backend total (backend has data inconsistency)
  const totalResults = meals.length;

  // Determine what to display
  const isLoading = viewMode === "nearby_vendors" 
    ? loadingNearbyVendors 
    : viewMode === "all_vendors" 
    ? loadingAllVendors 
    : loadingMeals;

  const refetch = viewMode === "nearby_vendors"
    ? refetchNearbyVendors
    : viewMode === "all_vendors"
    ? refetchAllVendors
    : refetchMeals;

  const vendors = viewMode === "nearby_vendors" 
    ? nearbyVendors 
    : viewMode === "all_vendors" 
    ? allVendors 
    : [];

  const showVendors = viewMode === "nearby_vendors" || viewMode === "all_vendors";
  const showProducts = viewMode === "products";

  // Type assertion to handle vendor union type
  const vendorsToDisplay = vendors as (Vendor | FeaturedVendor)[];

  // Convert FeaturedCategory to Category type for FilterPanel
  const convertedCategories = useMemo(() => 
    categories?.map(cat => ({
      id: String(cat.id),
      name: cat.name,
      slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
    })) || [],
    [categories]
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (minRating) count++;
    if (minPrice !== null || maxPrice !== null) count++;
    if (dietaryPreferences.length > 0) count++;
    return count;
  }, [selectedCategory, minRating, minPrice, maxPrice, dietaryPreferences]);

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-10 pb-2">
        <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-3">
          <IconSymbol name="magnifyingglass" size={20} color={Colors.light.icon} />
          <TextInput
            placeholder={
              showVendors 
                ? "Search for stores..." 
                : "Search for meals..."
            }
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-3 text-base"
            placeholderTextColor="#6b7280"
            style={{ color: '#111827' }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <IconSymbol name="xmark.circle.fill" size={20} color="#9ca3af" />
            </Pressable>
          )}
        </View>
        
        {showProducts && (
          <View className="flex-row items-center mt-3">
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                activeFiltersCount > 0 ? 'bg-[#1E8449]' : 'bg-gray-100'
              }`}
            >
              <IconSymbol 
                name="slider.horizontal.3" 
                size={16} 
                color={activeFiltersCount > 0 ? '#fff' : '#111'} 
              />
              <Text className={`ml-2 font-medium ${
                activeFiltersCount > 0 ? 'text-white' : 'text-gray-700'
              }`}>
                Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Text>
            </Pressable>
            
            <Text className="text-sm text-gray-500 ml-2">
              {totalResults} {totalResults === 1 ? 'result' : 'results'}
            </Text>
          </View>
        )}

        {showVendors && (
          <View className="flex-row items-center mt-3">
            <Text className="text-sm text-gray-500">
              {vendors?.length || 0} {viewMode === "nearby_vendors" ? "nearby" : ""} {vendors?.length === 1 ? 'store' : 'stores'}
            </Text>
          </View>
        )}
      </View>

      {showFilters && showProducts && (
        <View className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <FilterPanel
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            minRating={minRating}
            onRatingChange={setMinRating}
            categories={convertedCategories}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={(min, max) => {
              setMinPrice(min);
              setMaxPrice(max);
            }}
            dietaryPreferences={dietaryPreferences}
            onDietaryChange={setDietaryPreferences}
          />
        </View>
      )}

      {isLoading && (!mealsData && !vendors) ? (
        <View className="p-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="w-full h-24 rounded-2xl mb-4" />
          ))}
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.light.tint}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {showVendors && <VendorsSection vendors={vendorsToDisplay} />}
          {showProducts && <ProductsSection products={meals} />}

          {/* Load More Button for infinite scrolling */}
          {showProducts && hasNextPage && !isLoading && (
            <View className="px-4 mt-4 mb-6">
              <Pressable
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="bg-primary/10 rounded-2xl py-4 px-6 flex-row items-center justify-center border-2 border-primary/20"
              >
                {isFetchingNextPage ? (
                  <>
                    <ActivityIndicator size="small" color="#15785B" />
                    <Text className="text-primary font-semibold ml-3">Loading more...</Text>
                  </>
                ) : (
                  <>
                    <IconSymbol name="arrow.down.circle.fill" size={20} color="#15785B" />
                    <Text className="text-primary font-semibold ml-2">
                      Load More Products
                    </Text>
                  </>
                )}
              </Pressable>
              <Text className="text-center text-xs text-gray-500 mt-2">
                Showing {meals.length} of {totalResults} products
              </Text>
            </View>
          )}

          {!isLoading && showProducts && totalResults === 0 && (
            <EmptyState hasSearchQuery={!!debouncedSearchQuery} />
          )}
          
          {!isLoading && showVendors && (!vendors || vendors.length === 0) && (
            <View className="px-4 py-12 items-center">
              <IconSymbol name="storefront" size={48} color="#9ca3af" />
              <Text className="text-gray-500 text-center mt-4 text-base">
                {viewMode === "nearby_vendors" 
                  ? "No stores found nearby" 
                  : "No stores available at the moment"}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}