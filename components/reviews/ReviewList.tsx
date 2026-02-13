/**
 * ReviewList Component
 * Displays a list of reviews with pagination and loading states
 */

import { Button } from '@/components/ui/button';
import type { Review } from '@/types/api';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { ReviewCard } from './ReviewCard';
import { RatingDisplay } from './StarRating';

export interface ReviewListProps {
  /** Array of reviews to display */
  reviews: Review[];
  /** Total number of reviews */
  totalReviews?: number;
  /** Average rating */
  averageRating?: string | number;
  /** Whether the list is loading */
  loading?: boolean;
  /** Whether the list is refreshing */
  refreshing?: boolean;
  /** Called when pull to refresh */
  onRefresh?: () => void;
  /** Called when reaching the end (pagination) */
  onLoadMore?: () => void;
  /** Whether there are more pages to load */
  hasMore?: boolean;
  /** Whether currently loading more */
  loadingMore?: boolean;
  /** Current user ID to identify own reviews */
  currentUserId?: number;
  /** Called when edit is pressed on own review */
  onEditReview?: (review: Review) => void;
  /** Called when delete is pressed on own review */
  onDeleteReview?: (reviewId: number) => void;
  /** Show product info for each review */
  showProduct?: boolean;
  /** Show vendor info for each review */
  showVendor?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Whether this list is nested inside a ScrollView (renders without FlatList) */
  nestedInScrollView?: boolean;
}

export function ReviewList({
  reviews,
  totalReviews,
  averageRating,
  loading = false,
  refreshing = false,
  onRefresh,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
  currentUserId,
  onEditReview,
  onDeleteReview,
  showProduct = false,
  showVendor = false,
  emptyMessage = 'No reviews yet',
  nestedInScrollView = false,
}: ReviewListProps) {
  // Header with average rating
  const renderHeader = () => {
    if (!averageRating || !totalReviews) return null;

    return (
      <View style={styles.header}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Customer Reviews</Text>
          <View style={styles.summaryContent}>
            <View style={styles.ratingSection}>
              <Text style={styles.averageRating}>
                {typeof averageRating === 'string'
                  ? parseFloat(averageRating).toFixed(1)
                  : averageRating.toFixed(1)}
              </Text>
              <RatingDisplay
                rating={averageRating}
                reviewCount={totalReviews}
                showCount={false}
                size={20}
              />
              <Text style={styles.reviewCount}>
                Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Empty state
  const renderEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptySubtext}>
          Be the first to share your experience!
        </Text>
      </View>
    );
  };

  // Footer with load more button
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#10B981" />
        </View>
      );
    }

    if (hasMore && !loading) {
      return (
        <View style={styles.footerButton}>
          <Button variant="outline" onPress={onLoadMore}>
            <Text>Load More Reviews</Text>
          </Button>
        </View>
      );
    }

    return null;
  };

  // Initial loading state
  if (loading && reviews.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading reviews...</Text>
      </View>
    );
  }

  // Render as simple View when nested in ScrollView to avoid VirtualizedList warning
  if (nestedInScrollView) {
    return (
      <View style={styles.listContent}>
        {renderHeader()}
        {reviews.length === 0 ? (
          renderEmpty()
        ) : (
          <>
            {reviews.map((item) => (
              <ReviewCard
                key={item.id}
                review={item}
                isOwnReview={currentUserId ? item.customer_id === currentUserId : false}
                onEdit={onEditReview}
                onDelete={onDeleteReview}
                showProduct={showProduct}
                showVendor={showVendor}
              />
            ))}
            {renderFooter()}
          </>
        )}
      </View>
    );
  }

  return (
    <FlatList
      data={reviews}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <ReviewCard
          review={item}
          isOwnReview={currentUserId ? item.customer_id === currentUserId : false}
          onEdit={onEditReview}
          onDelete={onDeleteReview}
          showProduct={showProduct}
          showVendor={showVendor}
        />
      )}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
            colors={['#10B981']}
          />
        ) : undefined
      }
      onEndReached={hasMore && !loadingMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  summaryContent: {
    alignItems: 'center',
  },
  ratingSection: {
    alignItems: 'center',
  },
  averageRating: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerButton: {
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});
