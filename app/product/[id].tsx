import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AddToCartButton,
  ProductAdditionalInfo,
  ProductImageHeader,
  ProductInfoCard,
  VendorInfoCard
} from "@/components/product";
import { RatingDisplay, ReviewList } from "@/components/reviews";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { useMeal } from "@/lib/hooks";
import { useHybridAddToCart, useHybridCart } from "@/lib/hooks/use-hybrid-cart";
import { useProductReviews } from "@/lib/hooks/use-reviews";

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useMeal(id || "");
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    Record<string, string[]>
  >({});
  const [showCartButton, setShowCartButton] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  
  const addToCartMutation = useHybridAddToCart();
  const { totalItems } = useHybridCart();

  // Fetch product reviews
  const {
    reviews,
    totalReviews,
    averageRating,
    loading: reviewsLoading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
  } = useProductReviews(id ? parseInt(id) : 0);

  if (isLoading) {
    return (
      <View className="flex-1" style={{ paddingTop: insets.top }}>
        <Skeleton className="w-full h-64" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Product not found</Text>
        <Button onPress={() => router.back()} className="mt-4">
          <Text className="text-white">Go Back</Text>
        </Button>
      </View>
    );
  }
  
  const handleAddToCart = () => {
    addToCartMutation.mutate({
      product_id: product.id,
      quantity,
      product, // Pass product for local cart
    });
  };

  // Debug log all product data
  console.log("Product Data:", { product });

  return (
    <View className="flex-1 bg-gray-50">
      <ProductImageHeader images={[product.photo_url]} />
      
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 256, paddingBottom: 120 }}
      >
        {product.vendor && <VendorInfoCard vendor={product.vendor} />}

        <ProductInfoCard product={product} />

        <ProductAdditionalInfo product={product} />

        {/* Reviews Section */}
        <View className="mt-4 px-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold">Customer Reviews</Text>
            {product.average_rating && product.total_reviews && (
              <RatingDisplay
                rating={product.average_rating}
                reviewCount={product.total_reviews}
                size={16}
              />
            )}
          </View>
          
          {/* Show compact preview or full list */}
          {!showAllReviews ? (
            <View>
              {/* Show first 3 reviews in compact format */}
              {reviews.slice(0, 3).map((review) => (
                <View
                  key={review.id}
                  className="mb-3 p-4 bg-white rounded-2xl border border-gray-100"
                >
                  <View className="flex-row items-start mb-2">
                    <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-3">
                      <Text className="text-white font-bold text-sm">
                        {review.customer?.first_name?.charAt(0)?.toUpperCase() || "U"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-base">
                        {review.customer?.first_name && review.customer?.last_name
                          ? `${review.customer.first_name} ${review.customer.last_name}`
                          : "Anonymous"}
                      </Text>
                      <RatingDisplay rating={review.rating} size={14} />
                    </View>
                  </View>
                  <Text className="text-gray-700 leading-5" numberOfLines={3}>
                    {review.comment}
                  </Text>
                </View>
              ))}
              
              {/* View All button */}
              {reviews.length > 3 && (
                <Button
                  variant="outline"
                  onPress={() => setShowAllReviews(true)}
                  className="w-full mt-2"
                >
                  <Text className="font-semibold">
                    View All {totalReviews} Reviews
                  </Text>
                </Button>
              )}
              
              {/* Show message if no reviews */}
              {reviews.length === 0 && (
                <Text className="text-gray-500 text-center py-8">
                  No reviews yet for this product
                </Text>
              )}
            </View>
          ) : (
            <View>
              {/* Show Less button */}
              <Button
                variant="outline"
                onPress={() => setShowAllReviews(false)}
                className="w-full mb-3"
              >
                <Text className="font-semibold">Show Less</Text>
              </Button>
              
              {/* Full review list in scrollable container */}
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
                  emptyMessage="No reviews yet for this product"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Floating Go to Cart Button - Shows when cart has items */}
      {totalItems > 0 && (
        <View
          className="absolute bottom-50 right-4 z-50"
        >
          <Pressable
            onPress={() => router.push('/(tabs)/cart')}
            style={{
              backgroundColor: '#1E8449',
              borderRadius: 32,
              width: 64,
              height: 64,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <IconSymbol name="cart.fill" size={28} color="white" />
            <View 
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: '#EF4444',
                borderRadius: 12,
                minWidth: 24,
                height: 24,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                {totalItems}
              </Text>
            </View>
          </Pressable>
        </View>
      )}

      <AddToCartButton
        product={product}
        quantity={quantity}
        selectedCustomizations={selectedCustomizations}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        isLoading={addToCartMutation.isPending}
      />
    </View>
  );
}
