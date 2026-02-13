/**
 * ReviewCard Component
 * Displays a single review with customer info, rating, and comment
 */

import type { Review } from '@/types/api';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { StarRating } from './StarRating';

export interface ReviewCardProps {
  /** Review data */
  review: Review;
  /** Whether this is the current user's review */
  isOwnReview?: boolean;
  /** Called when edit is pressed (own reviews only) */
  onEdit?: (review: Review) => void;
  /** Called when delete is pressed (own reviews only) */
  onDelete?: (reviewId: number) => void;
  /** Show product info (for customer review list) */
  showProduct?: boolean;
  /** Show vendor info (for customer review list) */
  showVendor?: boolean;
}

export function ReviewCard({
  review,
  isOwnReview = false,
  onEdit,
  onDelete,
  showProduct = false,
  showVendor = false,
}: ReviewCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(review.id),
        },
      ]
    );
  };

  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return new Date(dateString).toLocaleDateString();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with customer info and actions */}
      <View style={styles.header}>
        <View style={styles.customerInfo}>
          {/* Customer Avatar/Initial */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {review.customer?.first_name?.charAt(0) || '?'}
            </Text>
          </View>

          {/* Customer Name and Date */}
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>
              {review.customer?.first_name || 'Anonymous'}{' '}
              {review.customer?.last_name?.charAt(0) || ''}.
            </Text>
            <Text style={styles.date}>{getRelativeTime(review.createdAt)}</Text>
          </View>
        </View>

        {/* Actions for own reviews */}
        {isOwnReview && (onEdit || onDelete) && (
          <View style={styles.actions}>
            {onEdit && (
              <Pressable
                onPress={() => onEdit(review)}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
              >
                <Ionicons name="create-outline" size={20} color="#6B7280" />
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                onPress={handleDelete}
                style={({ pressed }) => [
                  styles.actionButton,
                  pressed && styles.actionButtonPressed,
                ]}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Product/Vendor Info (if shown) */}
      {showProduct && review.product && (
        <View style={styles.productInfo}>
          {review.product.photo_url && (
            <Image
              source={{ uri: review.product.photo_url }}
              style={styles.productImage}
            />
          )}
          <Text style={styles.productName} numberOfLines={1}>
            {review.product.name}
          </Text>
        </View>
      )}

      {showVendor && review.vendor && (
        <View style={styles.vendorInfo}>
          <Ionicons name="storefront-outline" size={16} color="#6B7280" />
          <Text style={styles.vendorName}>{review.vendor.business_name}</Text>
        </View>
      )}

      {/* Rating */}
      <View style={styles.ratingContainer}>
        <StarRating rating={review.rating} size={18} />
      </View>

      {/* Comment */}
      {review.comment && (
        <Text style={styles.comment}>{review.comment}</Text>
      )}

      {/* Updated indicator */}
      {review.updatedAt !== review.createdAt && (
        <Text style={styles.updatedText}>Edited</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  actionButtonPressed: {
    opacity: 0.6,
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  vendorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  vendorName: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingContainer: {
    marginBottom: 8,
  },
  comment: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    marginTop: 4,
  },
  updatedText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
