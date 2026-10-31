import { DetailRefreshButton } from "@/components/ui/detail-refresh-button";
import { useDetailRefresh } from "@/lib/hooks/use-detail-refresh";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
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
import { buildVendorMenu } from "@/lib/vendor-menu";
import { useLocation } from "@/lib/hooks/useLocation";

export default function VendorDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: vendor,
    isLoading: isLoadingVendor,
    error: vendorError,
    refetch: refetchVendor,
  } = useVendor(id || "");
  const {
    data: products,
    isLoading: isLoadingProducts,
    isError: productsError,
    refetch: refetchProducts,
  } = useProducts(id || "");
  const { location } = useLocation();
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

  const {
    refreshing: screenRefreshing,
    refreshError,
    refresh: refreshScreen,
  } = useDetailRefresh([
    () => refetchVendor({ throwOnError: true }),
    () => refetchProducts({ throwOnError: true }),
    refresh,
  ]);
  const vendorUnavailable = [403, 404].includes(
    (vendorError as { response?: { status?: number } } | null)?.response
      ?.status || 0,
  );

  const menu = useMemo(() => buildVendorMenu(products), [products]);
  const activeCategory = menu.categories.find(
    (category) => category.key === selectedCategory,
  );
  const visibleProducts = activeCategory
    ? menu.productsByCategory.get(activeCategory.key) || []
    : menu.products;
  useEffect(() => {
    setSelectedCategory(null);
    setShowAllReviews(false);
  }, [id]);

  if (isLoadingVendor) {
    return <VendorLoadingState />;
  }

  if (!vendor || vendorUnavailable) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-lg text-gray-600">
          {vendorError && !vendorUnavailable
            ? "Unable to load this vendor"
            : "Vendor is currently unavailable"}
        </Text>
        <Pressable
          accessibilityRole="button"
          disabled={screenRefreshing}
          onPress={() => void refreshScreen()}
          className="mt-4 py-3"
        >
          <Text className="text-primary font-semibold">
            {screenRefreshing ? "Refreshing…" : "Try again"}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <VendorCoverHeader coverImage={vendor.logo} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        alwaysBounceVertical
        refreshControl={
          <RefreshControl
            refreshing={screenRefreshing}
            onRefresh={() => void refreshScreen()}
            tintColor="#008236"
            colors={["#008236"]}
            progressViewOffset={insets.top + 64}
          />
        }
        contentContainerStyle={{
          paddingTop: 224,
          paddingBottom: Math.max(insets.bottom, 16) + 20,
        }}
      >
        {!!refreshError && (
          <Text
            accessibilityRole="alert"
            className="mx-4 mb-3 text-sm text-red-700"
          >
            {refreshError}
          </Text>
        )}
        <VendorInfoCard vendor={vendor} />

        {/* Products Section */}
        {isLoadingProducts ? (
          <View className="px-4">
            <Skeleton className="w-full h-32 rounded-2xl mb-4" />
            <Skeleton className="w-full h-32 rounded-2xl mb-4" />
          </View>
        ) : productsError ? (
          <View className="mx-4 mb-6 rounded-2xl border border-gray-200 bg-white p-5">
            <Text className="font-semibold text-gray-900">
              Unable to load this menu
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Check your connection and try again.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => refetchProducts()}
              className="mt-3 self-start py-2"
            >
              <Text className="font-semibold text-primary">Try again</Text>
            </Pressable>
          </View>
        ) : menu.products.length > 0 ? (
          <View className="px-4">
            <CategoryFilter
              categories={menu.categories}
              total={menu.products.length}
              selectedCategory={activeCategory?.key ?? null}
              onSelectCategory={setSelectedCategory}
            />
            <VendorProductsSection
              products={visibleProducts}
              label={activeCategory?.label || "All items"}
              userLocation={location?.coords}
            />
          </View>
        ) : (
          <VendorEmptyState />
        )}

        {/* Reviews Section */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold">Customer Reviews</Text>
            {!!(vendor.rating && totalReviews > 0) && (
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
                refreshing={refreshing || screenRefreshing}
                onRefresh={refreshScreen}
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
                              {review.customer?.first_name?.charAt(0) || "?"}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text className="font-semibold">
                              {review.customer?.first_name || "Anonymous"}
                            </Text>
                          </View>
                          <RatingDisplay
                            rating={review.rating}
                            showCount={false}
                            size={14}
                          />
                        </View>
                        {review.comment && (
                          <Text
                            className="text-gray-700 text-sm"
                            numberOfLines={3}
                          >
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
      </ScrollView>
      <DetailRefreshButton
        label="Refresh vendor details and menu"
        refreshing={screenRefreshing}
        onRefresh={() => void refreshScreen()}
      />
    </View>
  );
}
