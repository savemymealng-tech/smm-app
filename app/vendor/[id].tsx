import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RatingDisplay, ReviewList } from "@/components/reviews";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import {
  CategoryFilter,
  VendorCoverHeader,
  VendorEmptyState,
  VendorInfoCard,
  VendorLoadingState,
  VendorProductsSection,
} from "@/components/vendor";
import { useProducts } from "@/lib/hooks/use-products";
import { useVendorReviews } from "@/lib/hooks/use-reviews";
import { useVendor } from "@/lib/hooks/use-vendors";

export default function VendorDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: vendor, isLoading: isLoadingVendor } = useVendor(id || "");
  const { data: products, isLoading: isLoadingProducts } = useProducts(
    id || ""
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);

  // Fetch vendor reviews
  const {
    reviews,
    totalReviews,
    averageRating,
    loading: reviewsLoading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
  } = useVendorReviews(id ? parseInt(id) : 0);

  if (isLoadingVendor) {
    return <VendorLoadingState />;
  }

  if (!vendor) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-lg text-gray-600">Vendor not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  // Group products by category
  const productsByCategory = useMemo(() => {
    if (!products || !Array.isArray(products)) return {};
    const grouped: Record<string, typeof products> = {};
    products.forEach((product) => {
      // Get category name from categories array (first category if multiple)
      const categoryName = product.categories?.[0]?.name || "Other";
      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }
      grouped[categoryName].push(product);
    });
    return grouped;
  }, [products]);

  // Get unique categories
  const categories = useMemo(() => {
    return Object.keys(productsByCategory);
  }, [productsByCategory]);

  return (
    <View className="flex-1 bg-gray-50">
      <VendorCoverHeader coverImage={vendor.logo} />
      
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 224, paddingBottom: 20 }}
      >
        <VendorInfoCard vendor={vendor} />

        {/* Reviews Section */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold">Customer Reviews</Text>
            {vendor.rating && totalReviews > 0 && (
              <RatingDisplay
                rating={vendor.rating}
                reviewCount={totalReviews}
                size={16}
              />
            )}
          </View>

          {showAllReviews ? (
            <View style={{ height: 500 }}>
              <ReviewList
                reviews={reviews}
                totalReviews={totalReviews}
                averageRating={averageRating}
                loading={reviewsLoading}
                refreshing={refreshing}
                onRefresh={refresh}
                onLoadMore={loadMore}
                hasMore={hasMore}
                showProduct={true}
                emptyMessage="No reviews yet for this vendor"
              />
            </View>
          ) : (
            <>
              {reviews.length > 0 ? (
                <>
                  <View className="mb-4">
                    {reviews.slice(0, 3).map((review) => (
                      <View
                        key={review.id}
                        className="bg-white p-4 rounded-lg mb-3 shadow-sm"
                      >
                        <View className="flex-row items-center mb-2">
                          <View className="bg-green-600 w-8 h-8 rounded-full items-center justify-center mr-2">
                            <Text className="text-white font-bold">
                              {review.customer?.first_name?.charAt(0) || '?'}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="font-semibold">
                              {review.customer?.first_name || 'Anonymous'}
                            </Text>
                          </View>
                          <RatingDisplay
                            rating={review.rating}
                            showCount={false}
                            size={14}
                          />
                        </View>
                        {review.comment && (
                          <Text className="text-gray-700 text-sm" numberOfLines={3}>
                            {review.comment}
                          </Text>
                        )}
                        {review.product && (
                          <Text className="text-gray-500 text-xs mt-2">
                            {review.product.name}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                  {totalReviews > 3 && (
                    <Pressable
                      onPress={() => setShowAllReviews(true)}
                      className="bg-gray-100 py-3 rounded-lg items-center"
                    >
                      <Text className="text-green-600 font-semibold">
                        View All {totalReviews} Reviews
                      </Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <View className="bg-white p-6 rounded-lg items-center">
                  <Text className="text-gray-500">No reviews yet</Text>
                </View>
              )}
            </>
          )}

          {showAllReviews && (
            <Pressable
              onPress={() => setShowAllReviews(false)}
              className="mt-4 bg-gray-100 py-3 rounded-lg items-center"
            >
              <Text className="text-green-600 font-semibold">Show Less</Text>
            </Pressable>
          )}
        </View>

        {/* Products Section */}
        {isLoadingProducts ? (
          <View className="px-4">
            <Skeleton className="w-full h-32 rounded-2xl mb-4" />
            <Skeleton className="w-full h-32 rounded-2xl mb-4" />
          </View>
        ) : products && products.length > 0 ? (
          <View className="px-4">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
            <VendorProductsSection
              products={products}
              productsByCategory={productsByCategory}
              categories={categories}
              selectedCategory={selectedCategory}
            />
          </View>
        ) : (
          <VendorEmptyState />
        )}
      </ScrollView>
    </View>
  );
}
