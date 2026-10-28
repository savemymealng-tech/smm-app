import { toast } from '@/components/ui/toast';
import { remainingStock } from '@/lib/product-display';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AddToCartButton,
  ProductAdditionalInfo,
  ProductImageHeader,
  ProductInfoCard,
  VendorInfoCard,
} from '@/components/product';
import { RatingDisplay, ReviewList } from '@/components/reviews';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useMeal } from '@/lib/hooks';
import { useHybridAddToCart, useHybridCart } from '@/lib/hooks/use-hybrid-cart';
import { useProductReviews } from '@/lib/hooks/use-reviews';

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, isLoading } = useMeal(id || '');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const addToCartMutation = useHybridAddToCart();
  const { totalItems, cart } = useHybridCart();
  const inCart = cart
    .filter((item) => Number(item.productId) === product?.id)
    .reduce((sum, item) => sum + item.quantity, 0);
  const maxQuantity = remainingStock(product?.quantity_available || 0, inCart);
  useEffect(() => {
    setQuantity(1);
    setShowAllReviews(false);
  }, [id]);
  useEffect(() => {
    setQuantity((q) => Math.max(1, Math.min(q, maxQuantity)));
  }, [maxQuantity]);

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

  const handleAddToCart = async () => {
    if (quantity > maxQuantity || adding) return;
    setAdding(true);
    try {
      await addToCartMutation.mutateAsync({
        product_id: product.id,
        quantity,
        product,
        fulfillment_method: 'pickup',
      });
    } catch (error) {
      if (!addToCartMutation.isError)
        toast.error(
          'Could not add item',
          error instanceof Error ? error.message : 'Please try again.',
        );
    } finally {
      setAdding(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <ProductImageHeader images={[product.photo_url]} />
        <ProductInfoCard product={product} />
        {product.vendor && <VendorInfoCard vendor={product.vendor} />}

        <ProductAdditionalInfo product={product} />

        {/* Reviews Section */}
        <View className="mt-4 px-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold">Customer Reviews</Text>
            {product.average_rating != null &&
              product.total_reviews != null && (
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
                        {review.customer?.first_name
                          ?.charAt(0)
                          ?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-semibold text-base">
                        {review.customer?.first_name &&
                        review.customer?.last_name
                          ? `${review.customer.first_name} ${review.customer.last_name}`
                          : 'Anonymous'}
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
              {totalReviews > 3 && (
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

      {totalItems > 0 && (
        <Pressable
          onPress={() => router.push('/(tabs)/cart')}
          className="bg-green-50 px-4 py-2"
        >
          <Text className="text-center text-[#008236] font-semibold">
            View cart · {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </Text>
        </Pressable>
      )}

      <AddToCartButton
        product={product}
        quantity={quantity}
        maxQuantity={maxQuantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        isLoading={adding || addToCartMutation.isPending}
      />
    </View>
  );
}
