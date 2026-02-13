/**
 * ReviewForm Component
 * Form for submitting and editing product reviews
 */

import { Button } from '@/components/ui/button';
import type { Review } from '@/types/api';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { StarRating } from './StarRating';

export interface ReviewFormProps {
  /** Existing review for editing (optional) */
  review?: Review;
  /** Product name for display */
  productName?: string;
  /** Order ID (required for new review) */
  orderId?: number;
  /** Product ID (required for new review) */
  productId?: number;
  /** Called when form is submitted */
  onSubmit: (data: { rating: number; comment: string }) => Promise<void>;
  /** Called when form is cancelled */
  onCancel?: () => void;
  /** Whether the form is in loading state */
  loading?: boolean;
}

export function ReviewForm({
  review,
  productName,
  orderId,
  productId,
  onSubmit,
  onCancel,
  loading = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(review?.rating || 0);
  const [comment, setComment] = useState(review?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxCommentLength = 1000;
  const isEditing = !!review;

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting');
      return;
    }

    if (comment.length > maxCommentLength) {
      Alert.alert(
        'Comment Too Long',
        `Your comment must be ${maxCommentLength} characters or less`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({ rating, comment: comment.trim() });
      // Parent component handles success notification
    } catch (error: any) {
      console.error('Submit review error:', error);
      // Handle both API error format (error.error) and standard Error (error.message)
      const errorMessage = error.error || (error instanceof Error ? error.message : '') || 'Failed to submit review';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? 'Edit Your Review' : 'Write a Review'}
          </Text>
          {productName && (
            <Text style={styles.productName}>{productName}</Text>
          )}
        </View>

        {/* Rating Section */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Your Rating <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.ratingContainer}>
            <StarRating
              rating={rating}
              size={32}
              interactive
              showHalfStars={false}
              onRatingChange={setRating}
            />
            {rating > 0 && (
              <Text style={styles.ratingText}>
                {rating} {rating === 1 ? 'star' : 'stars'}
              </Text>
            )}
          </View>
        </View>

        {/* Comment Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Your Review (Optional)</Text>
          <TextInput
            style={styles.textArea}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience with this product..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            maxLength={maxCommentLength}
            textAlignVertical="top"
            editable={!isSubmitting && !loading}
          />
          <Text style={styles.characterCount}>
            {comment.length} / {maxCommentLength} characters
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            onPress={handleSubmit}
            disabled={rating === 0 || isSubmitting || loading}
            className="w-full"
          >
            <Text className="text-white font-semibold">
              {isSubmitting || loading
                ? 'Submitting...'
                : isEditing
                ? 'Update Review'
                : 'Submit Review'}
            </Text>
          </Button>

          {onCancel && (
            <Button
              variant="outline"
              onPress={onCancel}
              disabled={isSubmitting || loading}
              className="w-full"
            >
              <Text className="text-gray-700 font-medium">Cancel</Text>
            </Button>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  required: {
    color: '#EF4444',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
});
