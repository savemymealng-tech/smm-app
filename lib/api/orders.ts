/**
 * Orders API Service
 * Handles order placement and tracking per SaveMyMeal API Guide v2.0.0
 */

import type {
  Order,
  PlaceOrderRequest,
  Review,
  SubmitReviewRequest,
} from '@/types/api';
import apiClient, { ApiResponse } from './client';
import { API_CONFIG } from './config';

export type OrderHistoryGroup = {
  order_group_id: string;
  orders: Order[];
  grand_total: string;
  created_at: string;
};
export type OrderHistoryPage = {
  success: boolean;
  data: (Order | OrderHistoryGroup)[];
  counts: { all: number; progress: number; past: number };
  page: number;
  total: number;
  totalPages: number;
};
export const ordersApi = {
  async groupDetails(id: string): Promise<Order[]> {
    const response = await apiClient.get<ApiResponse<Order[]>>(
      `/customers/orders/group/${encodeURIComponent(id)}`,
    );
    if (!response.data.success || !response.data.data)
      throw new Error(response.data.error || 'Unable to load order');
    return response.data.data;
  },
  async historyPage(
    tab: 'all' | 'progress' | 'past',
    page: number,
  ): Promise<OrderHistoryPage> {
    const response = await apiClient.get<OrderHistoryPage>(
      '/customers/orders/history',
      { params: { tab, page, limit: 15 } },
    );
    if (!response.data.success) throw new Error('Unable to load orders');
    return response.data;
  },
  /**
   * Place New Order
   * POST /customers/orders
   */
  async placeOrder(
    data: PlaceOrderRequest,
  ): Promise<
    Order | { orders: Order | Order[]; payment: unknown; error?: string }
  > {
    const body = data.use_cart
      ? {
          use_cart: true,
          campaign_code: data.campaign_code,
          coins: data.coins,
          quote_token: data.quote_token,
          request_key: data.request_key,
          address_id: data.address_id,
          delivery_address: data.delivery_address,
          recipient_name: data.recipient_name,
          special_instructions: data.special_instructions,
          payment_method: data.payment_method,
        }
      : data;
    const response = await apiClient.post<
      ApiResponse<
        Order | { orders: Order | Order[]; payment: unknown; error?: string }
      >
    >(API_CONFIG.ENDPOINTS.ORDERS.PLACE, body);

    if (response.data.success && response.data.data) {
      return response.data.data as
        | Order
        | { orders: Order | Order[]; payment: unknown; error?: string };
    }

    throw new Error(response.data.error || 'Failed to place order');
  },

  /**
   * Get Order History
   * GET /customers/orders
   */
  async getOrderHistory(): Promise<Order[]> {
    const response = await apiClient.get<ApiResponse<Order[]>>(
      API_CONFIG.ENDPOINTS.ORDERS.LIST,
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to fetch order history');
  },

  /**
   * Track Order / Get Order Details
   * GET /customers/orders/:id
   */
  async trackOrder(id: number): Promise<Order> {
    console.log('trackOrder - Fetching order ID:', id);

    try {
      const response = await apiClient.get<ApiResponse<Order>>(
        API_CONFIG.ENDPOINTS.ORDERS.BY_ID(id),
      );

      console.log('trackOrder - Response:', {
        success: response.data.success,
        hasData: !!response.data.data,
        error: response.data.error,
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      }

      throw new Error(response.data.error || 'Failed to fetch order details');
    } catch (error: any) {
      console.error('trackOrder - Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  /**
   * Cancel Order
   * POST /customers/orders/:id/cancel
   */
  async cancelOrder(id: number): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(
      API_CONFIG.ENDPOINTS.ORDERS.CANCEL(id),
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to cancel order');
  },

  /**
   * Submit Order Review
   * POST /customers/orders/:id/review
   */
  async submitReview(data: SubmitReviewRequest): Promise<Review> {
    const response = await apiClient.post<ApiResponse<Review>>(
      `${API_CONFIG.ENDPOINTS.ORDERS.BY_ID(data.order_id)}/review`,
      data,
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || 'Failed to submit review');
  },
};
