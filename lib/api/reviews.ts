/**
 * Reviews API Service
 * Handles product reviews per SaveMyMeal Review System API Documentation
 */

import type {
    CustomerReviewsResponse,
    ProductReviewsResponse,
    Review,
    SubmitReviewRequest,
    UpdateReviewRequest,
    VendorReviewsResponse,
} from '@/types/api';
import apiClient, { ApiResponse } from './client';

export const reviewsApi = {
  /**
   * Submit Review
   * POST /api/v1/customers/reviews
   * Submit a review for a product from a completed order
   */
  async submitReview(data: SubmitReviewRequest): Promise<Review> {
    const response = await apiClient.post<ApiResponse<Review>>(
      '/customers/reviews',
      data
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || response.data.message || 'Failed to submit review');
  },

  /**
   * Get Customer Reviews
   * GET /api/v1/customers/reviews
   * Get all reviews submitted by the authenticated customer
   */
  async getCustomerReviews(page: number = 1, limit: number = 10): Promise<CustomerReviewsResponse> {
    const response = await apiClient.get<ApiResponse<CustomerReviewsResponse>>(
      `/customers/reviews?page=${page}&limit=${limit}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to fetch customer reviews');
  },

  /**
   * Update Review
   * PUT /api/v1/customers/reviews/:id
   * Update an existing review (rating and/or comment)
   */
  async updateReview(reviewId: number, data: UpdateReviewRequest): Promise<Review> {
    const response = await apiClient.put<ApiResponse<Review>>(
      `/customers/reviews/${reviewId}`,
      data
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || response.data.message || 'Failed to update review');
  },

  /**
   * Delete Review
   * DELETE /api/v1/customers/reviews/:id
   * Delete a review
   */
  async deleteReview(reviewId: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<null>>(
      `/customers/reviews/${reviewId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'Failed to delete review');
    }
  },

  /**
   * Get Product Reviews
   * GET /api/v1/reviews/products/:productId
   * Get all reviews for a specific product (public access)
   */
  async getProductReviews(productId: number, page: number = 1, limit: number = 10): Promise<ProductReviewsResponse> {
    const response = await apiClient.get<ApiResponse<ProductReviewsResponse>>(
      `/reviews/products/${productId}?page=${page}&limit=${limit}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to fetch product reviews');
  },

  /**
   * Get Vendor Reviews (Public)
   * GET /api/v1/reviews/vendors/:vendorId
   * Get all reviews for a vendor (across all their products)
   */
  async getVendorReviews(vendorId: number, page: number = 1, limit: number = 10): Promise<VendorReviewsResponse> {
    const response = await apiClient.get<ApiResponse<VendorReviewsResponse>>(
      `/reviews/vendors/${vendorId}?page=${page}&limit=${limit}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to fetch vendor reviews');
  },

  /**
   * Get Vendor Reviews (Authenticated Vendor)
   * GET /api/v1/vendors/reviews
   * Get all reviews for the authenticated vendor
   */
  async getMyVendorReviews(page: number = 1, limit: number = 10): Promise<VendorReviewsResponse> {
    const response = await apiClient.get<ApiResponse<VendorReviewsResponse>>(
      `/vendors/reviews?page=${page}&limit=${limit}`
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to fetch vendor reviews');
  },

  /**
   * Check if user can review a product from an order
   * Helper method to validate review eligibility
   */
  canReviewProduct(orderId: number, productId: number, orderStatus: string, paymentStatus?: string): {
    canReview: boolean;
    reason?: string;
  } {
    // Order must be completed/delivered and paid
    const validStatuses = ['completed', 'delivered'];
    const validPaymentStatuses = ['paid'];

    if (!validStatuses.includes(orderStatus)) {
      return {
        canReview: false,
        reason: 'Order must be completed or delivered',
      };
    }

    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return {
        canReview: false,
        reason: 'Order must be paid',
      };
    }

    return { canReview: true };
  },
};

/**
 * Helper function to get star rating display
 * Based on rating value, returns appropriate star display
 */
export function getStarDisplay(rating: number): {
  full: number;
  half: boolean;
  empty: number;
} {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return {
    full: fullStars,
    half: hasHalfStar,
    empty: emptyStars,
  };
}

/**
 * Helper function to format review count
 * Example: formatReviewCount(25) => "25 reviews"
 */
export function formatReviewCount(count: number): string {
  if (count === 0) return 'No reviews';
  if (count === 1) return '1 review';
  return `${count} reviews`;
}
