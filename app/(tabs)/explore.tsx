import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, TextInput, View } from "react-native";
import { useDebounce } from "use-debounce";

import {
  EmptyState,
  FilterPanel,
  ProductsSection,
} from "@/components/explore";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { useBrowseMeals, useFeaturedCategories } from "@/lib/hooks";
import type { BrowseMealsParams } from "@/types/api";

export default function ExploreScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    category?: string;
  }>();

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

  const browseParams: BrowseMealsParams = useMemo(() => {
    const params: any = {};
    
    if (debouncedSearchQuery) {
      params.search = debouncedSearchQuery;
    }
    if (selectedCategory) {
      params.category = selectedCategory;
    }
    if (minRating) {
      params.minRating = minRating;
    }
    if (minPrice !== null) {
      params.minPrice = minPrice;
    }
    if (maxPrice !== null) {
      params.maxPrice = maxPrice;
    }
    if (dietaryPreferences.length > 0) {
      params.dietaryPreferences = dietaryPreferences;
    }
    
    return params;
  }, [debouncedSearchQuery, selectedCategory, minRating, minPrice, maxPrice, dietaryPreferences]);

  const {
    data: mealsData,
    isLoading,
    refetch,
    isRefetching,
  } = useBrowseMeals(browseParams);

  const meals = mealsData?.data || [];
  const totalResults = mealsData?.total || 0;

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
            placeholder="Search for meals..."
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
      </View>

      {showFilters && (
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

      {isLoading && !mealsData ? (
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
          <ProductsSection products={meals} />

          {!isLoading && totalResults === 0 && (
            <EmptyState hasSearchQuery={!!debouncedSearchQuery} />
          )}
        </ScrollView>
      )}
    </View>
  );
}