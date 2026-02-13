/**
 * useReviews Hook
 * Custom hook for managing reviews
 */

import { api } from '@/lib/api';
import {
    customerReviewsAtom,
    productReviewsAtom,
    reviewSubmittingAtom,
    vendorReviewsAtom,
} from '@/lib/atoms/reviews';
import type {
    CustomerReviewsResponse,
    Review,
    SubmitReviewRequest,
    UpdateReviewRequest
} from '@/types/api';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

export function useReviews() {
  const [customerReviews, setCustomerReviews] = useAtom(customerReviewsAtom);
  const [submitting, setSubmitting] = useAtom(reviewSubmittingAtom);

  /**
   * Submit a new review
   */
  const submitReview = useCallback(
    async (data: SubmitReviewRequest): Promise<Review> => {
      setSubmitting(true);
      try {
        const review = await api.reviews.submitReview(data);
        
        // Update customer reviews list
        setCustomerReviews((prev) => [review, ...prev]);
        
        return review;
      } catch (error) {
        console.error('Submit review error:', error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [setCustomerReviews, setSubmitting]
  );

  /**
   * Update an existing review
   */
  const updateReview = useCallback(
    async (reviewId: number, data: UpdateReviewRequest): Promise<Review> => {
      setSubmitting(true);
      try {
        const updatedReview = await api.reviews.updateReview(reviewId, data);
        
        // Update in customer reviews list
        setCustomerReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? updatedReview : r))
        );
        
        return updatedReview;
      } catch (error) {
        console.error('Update review error:', error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [setCustomerReviews, setSubmitting]
  );

  /**
   * Delete a review
   */
  const deleteReview = useCallback(
    async (reviewId: number): Promise<void> => {
      setSubmitting(true);
      try {
        await api.reviews.deleteReview(reviewId);
        
        // Remove from customer reviews list
        setCustomerReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } catch (error) {
        console.error('Delete review error:', error);
        throw error;
      } finally {
        setSubmitting(false);
      }
    },
    [setCustomerReviews, setSubmitting]
  );

  /**
   * Fetch customer's reviews
   */
  const fetchCustomerReviews = useCallback(
    async (page: number = 1): Promise<CustomerReviewsResponse> => {
      try {
        const response = await api.reviews.getCustomerReviews(page);
        
        if (page === 1) {
          setCustomerReviews(response.data);
        } else {
          setCustomerReviews((prev) => [...prev, ...response.data]);
        }
        
        return response;
      } catch (error) {
        console.error('Fetch customer reviews error:', error);
        throw error;
      }
    },
    [setCustomerReviews]
  );

  return {
    customerReviews,
    submitting,
    submitReview,
    updateReview,
    deleteReview,
    fetchCustomerReviews,
  };
}

/**
 * useProductReviews Hook
 * Hook for fetching and managing product reviews
 */
export function useProductReviews(productId: number) {
  const [productReviews, setProductReviews] = useAtom(productReviewsAtom);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const reviews = productReviews[productId];

  /**
   * Fetch product reviews
   */
  const fetchReviews = useCallback(
    async (pageNum: number = 1, isRefreshing: boolean = false) => {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await api.reviews.getProductReviews(productId, pageNum);
        
        setProductReviews((prev) => ({
          ...prev,
          [productId]: {
            ...response,
            data:
              pageNum === 1
                ? response.data
                : [...(prev[productId]?.data || []), ...response.data],
          },
        }));

        setHasMore(pageNum < response.pages);
        setPage(pageNum);
      } catch (error: any) {
        console.error('Fetch product reviews error:', error);
        Alert.alert('Error', error.error || error.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [productId, setProductReviews]
  );

  /**
   * Load more reviews
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchReviews(page + 1);
    }
  }, [loading, hasMore, page, fetchReviews]);

  /**
   * Refresh reviews
   */
  const refresh = useCallback(() => {
    fetchReviews(1, true);
  }, [fetchReviews]);

  // Fetch on mount if not already loaded
  useEffect(() => {
    if (!reviews) {
      fetchReviews(1);
    }
  }, [productId]); // Only depend on productId

  return {
    reviews: reviews?.data || [],
    totalReviews: reviews?.total_reviews || 0,
    averageRating: reviews?.average_rating || '0',
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
  };
}

/**
 * useVendorReviews Hook
 * Hook for fetching and managing vendor reviews
 */
export function useVendorReviews(vendorId: number) {
  const [vendorReviews, setVendorReviews] = useAtom(vendorReviewsAtom);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const reviews = vendorReviews[vendorId];

  /**
   * Fetch vendor reviews
   */
  const fetchReviews = useCallback(
    async (pageNum: number = 1, isRefreshing: boolean = false) => {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await api.reviews.getVendorReviews(vendorId, pageNum);
        
        setVendorReviews((prev) => ({
          ...prev,
          [vendorId]: {
            ...response,
            data:
              pageNum === 1
                ? response.data
                : [...(prev[vendorId]?.data || []), ...response.data],
          },
        }));

        setHasMore(pageNum < response.pages);
        setPage(pageNum);
      } catch (error: any) {
        console.error('Fetch vendor reviews error:', error);
        Alert.alert('Error', error.error || error.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [vendorId, setVendorReviews]
  );

  /**
   * Load more reviews
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchReviews(page + 1);
    }
  }, [loading, hasMore, page, fetchReviews]);

  /**
   * Refresh reviews
   */
  const refresh = useCallback(() => {
    fetchReviews(1, true);
  }, [fetchReviews]);

  // Fetch on mount if not already loaded
  useEffect(() => {
    if (!reviews) {
      fetchReviews(1);
    }
  }, [vendorId]); // Only depend on vendorId

  return {
    reviews: reviews?.data || [],
    totalReviews: reviews?.total_reviews || 0,
    averageRating: reviews?.average_rating || '0',
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
  };
}

/**
 * Helper hook to check if a product can be reviewed from an order
 */
export function useCanReview(orderId: number, productId: number, orderStatus: string, paymentStatus?: string) {
  return api.reviews.canReviewProduct(orderId, productId, orderStatus, paymentStatus);
}

/**
 * useCustomerReviews Hook
 * Hook for fetching and managing customer's own reviews
 */
export function useCustomerReviews() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);

  /**
   * Fetch customer reviews
   */
  const fetchReviews = useCallback(
    async (pageNum: number = 1, isRefreshing: boolean = false) => {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await api.reviews.getCustomerReviews(pageNum);
        
        if (pageNum === 1) {
          setReviews(response.data);
        } else {
          setReviews((prev) => [...prev, ...response.data]);
        }
        
        setTotalReviews(response.total);
        setHasMore(pageNum < response.pages);
        setPage(pageNum);
      } catch (error: any) {
        console.error('Fetch customer reviews error:', error);
        Alert.alert('Error', error.error || error.message || 'Failed to load reviews');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /**
   * Load more reviews
   */
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchReviews(page + 1);
    }
  }, [loading, hasMore, page, fetchReviews]);

  /**
   * Refresh reviews
   */
  const refresh = useCallback(() => {
    fetchReviews(1, true);
  }, [fetchReviews]);

  // Fetch on mount
  useEffect(() => {
    fetchReviews(1);
  }, []);

  return {
    reviews,
    totalReviews,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
  };
}
