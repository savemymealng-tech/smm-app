import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useDebounce } from "use-debounce";

import {
  EmptyState,
  FilterPanel,
  Header,
  ProductsSection,
  VendorsSection,
} from "@/components/explore";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/lib/hooks/use-categories";
import { useSearch } from "@/lib/hooks/use-search";
import type { Filter, SortOption } from "../../types";
import { Colors } from "@/constants/theme";

export default function ExploreScreen() {
  const params = useLocalSearchParams<{
    q?: string;
    category?: string;
    sort?: SortOption;
  }>();

  const [searchQuery, setSearchQuery] = useState(params.q || "");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [sort, setSort] = useState<SortOption>(params.sort || "relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    params.category || null
  );
  const [minRating, setMinRating] = useState<number | null>(null);

  const { data: categories } = useCategories();

  const filters: Filter = useMemo(() => {
    const f: Filter = {};
    if (selectedCategory) {
      f.categories = [selectedCategory];
    }
    if (minRating) {
      f.minRating = minRating;
    }
    return f;
  }, [selectedCategory, minRating]);

  const {
    data: searchResults,
    isLoading,
    refetch,
    isRefetching,
  } = useSearch(debouncedSearchQuery, filters);

  const vendors = useMemo(() => {
    const vendorList = searchResults?.vendors || [];
    if (sort === "rating") {
      return [...vendorList].sort((a, b) => b.rating - a.rating);
    }
    if (sort === "deliveryTime") {
      return [...vendorList].sort((a, b) => a.deliveryTime - b.deliveryTime);
    }
    if (sort === "distance") {
      return [...vendorList].sort(
        (a, b) => (a.distance || 0) - (b.distance || 0)
      );
    }
    return vendorList;
  }, [searchResults?.vendors, sort]);

  const products = useMemo(() => {
    const productList = searchResults?.products || [];
    if (sort === "rating") {
      return [...productList].sort((a, b) => b.rating - a.rating);
    }
    return productList;
  }, [searchResults?.products, sort]);

  const totalResults = vendors.length + products.length;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory) count++;
    if (minRating) count++;
    return count;
  }, [selectedCategory, minRating]);

  return (
    <View className="flex-1 bg-white">
      <Header
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onSortChange={setSort}
        sort={sort}
        resultCount={totalResults}
        onFilterPress={() => setShowFilters(!showFilters)}
        activeFilters={activeFiltersCount}
      />

      {showFilters && (
        <View className="px-4 py-2 bg-gray-50 border-b border-gray-100">
          <FilterPanel
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            minRating={minRating}
            onRatingChange={setMinRating}
            categories={categories}
          />
        </View>
      )}

      {isLoading && !searchResults ? (
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
          <VendorsSection vendors={vendors} />
            <View className="h-4 bg-gray-50 my-2" />
          <ProductsSection products={products} />

          {!isLoading && totalResults === 0 && (
            <EmptyState hasSearchQuery={!!debouncedSearchQuery} />
          )}
        </ScrollView>
      )}
    </View>
  );
}
