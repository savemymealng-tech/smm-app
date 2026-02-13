import { router } from "expo-router";
import { useState } from "react";
import { Alert, Image, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RatingDisplay, ReviewForm } from "@/components/reviews";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import { api } from "@/lib/api";
import { useCustomerReviews } from "@/lib/hooks/use-reviews";
import { getImageSource } from "@/lib/utils";
import { Review } from "@/types/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function MyReviewsScreen() {
  const queryClient = useQueryClient();
  const {
    reviews,
    totalReviews,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
  } = useCustomerReviews();

  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => api.reviews.deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['product-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-reviews'] });
      setDeletingReview(null);
      refresh();
    },
  });

  const handleEdit = (review: Review) => {
    setEditingReview(review);
  };

  const handleDelete = (review: Review) => {
    setDeletingReview(review);
  };

  const confirmDelete = () => {
    if (deletingReview) {
      deleteMutation.mutate(deletingReview.id);
    }
  };

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      if (hasMore && !loading) {
        loadMore();
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-100 px-4 py-3">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
          </Pressable>
          <Text className="text-xl font-bold">My Reviews</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View className="px-4 py-4">
          {/* Summary */}
          {totalReviews > 0 && (
            <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <Text className="text-gray-600 text-sm">Total Reviews</Text>
              <Text className="text-3xl font-bold text-gray-900 mt-1">
                {totalReviews}
              </Text>
            </View>
          )}

          {/* Reviews List */}
          {reviews.length === 0 && !loading ? (
            <View className="bg-white rounded-2xl p-8 items-center">
              <IconSymbol name="star" size={48} color="#d1d5db" />
              <Text className="text-gray-500 text-lg font-semibold mt-4">
                No Reviews Yet
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                Your reviews will appear here after you rate products
              </Text>
            </View>
          ) : (
            reviews.map((review: Review) => (
              <View
                key={review.id}
                className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
              >
                {/* Product Info */}
                <Pressable
                  onPress={() => router.push(`/product/${review.product_id}`)}
                  className="flex-row items-center mb-3 pb-3 border-b border-gray-100"
                >
                  {review.product?.photo_url && (
                    <Image
                      source={getImageSource(review.product.photo_url)}
                      className="w-16 h-16 rounded-xl mr-3"
                    />
                  )}
                  <View className="flex-1">
                    <Text className="font-semibold text-base" numberOfLines={1}>
                      {review.product?.name || "Product"}
                    </Text>
                    {review.vendor && (
                      <Text className="text-gray-500 text-sm" numberOfLines={1}>
                        {review.vendor.business_name}
                      </Text>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={18} color="#9ca3af" />
                </Pressable>

                {/* Review Content */}
                <View className="mb-3">
                  <RatingDisplay rating={review.rating} size={16} />
                  <Text className="text-gray-700 mt-2 leading-5">
                    {review.comment}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-2">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </Text>
                </View>

                {/* Actions */}
                <View className="flex-row gap-2">
                  <Button
                    variant="outline"
                    onPress={() => handleEdit(review)}
                    className="flex-1"
                  >
                    <IconSymbol name="pencil" size={16} color={Colors.light.tint} />
                    <Text className="ml-2 text-sm font-semibold">Edit</Text>
                  </Button>
                  <Button
                    variant="outline"
                    onPress={() => handleDelete(review)}
                    className="flex-1 border-red-200"
                  >
                    <IconSymbol name="trash" size={16} color="#ef4444" />
                    <Text className="ml-2 text-sm font-semibold text-red-600">
                      Delete
                    </Text>
                  </Button>
                </View>
              </View>
            ))
          )}

          {/* Loading indicator */}
          {loading && reviews.length > 0 && (
            <View className="py-4 items-center">
              <Text className="text-gray-500">Loading more...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Review Bottom Sheet */}
      <BottomSheet
        visible={editingReview !== null}
        onClose={() => setEditingReview(null)}
      >
        {editingReview && (
          <View className="p-4">
            <Text className="text-xl font-bold mb-4">Edit Review</Text>
            <ReviewForm
              review={editingReview}
              productName={editingReview.product?.name}
              onSubmit={async (data) => {
                try {
                  await api.reviews.updateReview(editingReview.id, data);
                  queryClient.invalidateQueries({ queryKey: ['customer-reviews'] });
                  queryClient.invalidateQueries({ 
                    queryKey: ['product-reviews', editingReview.product_id] 
                  });
                  setEditingReview(null);
                  refresh();
                } catch (error: any) {
                  Alert.alert('Error', error?.error || error?.message || 'Failed to update review');
                }
              }}
              onCancel={() => setEditingReview(null)}
            />
          </View>
        )}
      </BottomSheet>

      {/* Delete Confirmation Bottom Sheet */}
      <BottomSheet
        visible={deletingReview !== null}
        onClose={() => setDeletingReview(null)}
      >
        {deletingReview && (
          <View className="p-6">
            <Text className="text-xl font-bold mb-2">Delete Review?</Text>
            <Text className="text-gray-600 mb-6">
              Are you sure you want to delete your review for{" "}
              {deletingReview.product?.name}? This action cannot be undone.
            </Text>
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                onPress={() => setDeletingReview(null)}
                className="flex-1"
              >
                <Text className="font-semibold">Cancel</Text>
              </Button>
              <Button
                onPress={confirmDelete}
                className="flex-1 bg-red-600"
                disabled={deleteMutation.isPending}
              >
                <Text className="font-semibold text-white">
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </Text>
              </Button>
            </View>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}
