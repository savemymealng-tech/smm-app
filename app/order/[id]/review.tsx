import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useSubmitReview, useTrackOrder } from '@/lib/hooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  size?: number;
  label?: string;
}

function StarRating({ rating, onRatingChange, size = 32, label }: StarRatingProps) {
  return (
    <View>
      {label && (
        <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      )}
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onRatingChange(star)}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
            className="mr-1"
          >
            <IconSymbol
              name={star <= rating ? 'star.fill' : 'star'}
              size={size}
              color={star <= rating ? '#F59E0B' : '#D1D5DB'}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: order, isLoading } = useTrackOrder(id || '');
  const submitReviewMutation = useSubmitReview();

  // Form state
  const [overallRating, setOverallRating] = useState(0);
  const [foodQualityRating, setFoodQualityRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [packagingRating, setPackagingRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const handleSubmit = () => {
    if (overallRating === 0) {
      return;
    }

    submitReviewMutation.mutate({
      order_id: Number(id),
      rating: overallRating,
      review: reviewText.trim() || undefined,
      food_quality_rating: foodQualityRating || undefined,
      delivery_rating: deliveryRating || undefined,
      packaging_rating: packagingRating || undefined,
    });
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1:
        return 'Poor';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Very Good';
      case 5:
        return 'Excellent';
      default:
        return 'Tap to rate';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <Skeleton className="w-32 h-6" />
        </View>
        <View className="p-4">
          <Skeleton className="w-full h-40 rounded-2xl mb-4" />
          <Skeleton className="w-full h-32 rounded-2xl" />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-semibold">Order not found</Text>
        <Button onPress={() => router.back()} className="mt-4">
          <Text className="text-white">Go Back</Text>
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <IconSymbol name="arrow.left" size={24} color="#000" />
          </Pressable>
          <Text className="text-xl font-bold">Rate Your Order</Text>
        </View>

        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {/* Order Info */}
          <View className="bg-white p-4 mb-4">
            <View className="flex-row items-center">
              <Image
                source={
                  order.vendor?.logo
                    ? { uri: order.vendor.logo }
                    : require('@/assets/images/default-profile.jpg')
                }
                className="w-14 h-14 rounded-full mr-3"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="font-semibold text-base">
                  {order.vendor?.business_name || 'Vendor'}
                </Text>
                <Text className="text-gray-600 text-sm">
                  Order #{order.id} · {order.items.length} item
                  {order.items.length > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Overall Rating */}
          <View className="bg-white p-4 mb-4">
            <Text className="text-lg font-semibold mb-4 text-center">
              How was your experience?
            </Text>

            <View className="items-center mb-3">
              <StarRating
                rating={overallRating}
                onRatingChange={setOverallRating}
                size={44}
              />
              <Text
                className={`mt-3 text-lg font-medium ${
                  overallRating > 0 ? 'text-amber-600' : 'text-gray-400'
                }`}
              >
                {getRatingLabel(overallRating)}
              </Text>
            </View>
          </View>

          {/* Detailed Ratings */}
          <View className="bg-white p-4 mb-4">
            <Text className="text-lg font-semibold mb-4">
              Rate specific aspects (optional)
            </Text>

            <View className="space-y-5">
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center">
                  <IconSymbol name="fork.knife" size={20} color="#666" />
                  <Text className="ml-2 text-gray-700">Food Quality</Text>
                </View>
                <StarRating
                  rating={foodQualityRating}
                  onRatingChange={setFoodQualityRating}
                  size={24}
                />
              </View>

              <View className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center">
                  <IconSymbol name="car.fill" size={20} color="#666" />
                  <Text className="ml-2 text-gray-700">Delivery</Text>
                </View>
                <StarRating
                  rating={deliveryRating}
                  onRatingChange={setDeliveryRating}
                  size={24}
                />
              </View>

              <View className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center">
                  <IconSymbol name="shippingbox.fill" size={20} color="#666" />
                  <Text className="ml-2 text-gray-700">Packaging</Text>
                </View>
                <StarRating
                  rating={packagingRating}
                  onRatingChange={setPackagingRating}
                  size={24}
                />
              </View>
            </View>
          </View>

          {/* Review Text */}
          <View className="bg-white p-4 mb-6">
            <Text className="text-lg font-semibold mb-3">
              Share your thoughts (optional)
            </Text>
            <TextInput
              placeholder="Tell others about your experience..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={500}
              placeholderTextColor="#9CA3AF"
              style={{
                minHeight: 120,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 15,
                color: '#111827',
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
            />
            <Text className="text-gray-500 text-sm text-right mt-2">
              {reviewText.length}/500
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View
          className="bg-white p-4 border-t border-gray-200"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {overallRating === 0 && (
            <Text className="text-amber-600 text-sm mb-2 text-center">
              Please select an overall rating to continue
            </Text>
          )}
          <Button
            onPress={handleSubmit}
            disabled={overallRating === 0 || submitReviewMutation.isPending}
            className="w-full"
          >
            {submitReviewMutation.isPending ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white ml-2">Submitting...</Text>
              </View>
            ) : (
              <Text className="text-white">Submit Review</Text>
            )}
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
