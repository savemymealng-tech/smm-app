/**
 * Orders API Service
 * Handles order placement and tracking per SaveMyMeal API Guide v2.0.0
 */

import apiClient, { ApiResponse } from './client';
import { API_CONFIG } from './config';
import type { Order, PlaceOrderRequest } from '@/types/api';

export const ordersApi = {
  /**
   * Place New Order
   * POST /customers/orders
   */
  async placeOrder(data: PlaceOrderRequest): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(
      API_CONFIG.ENDPOINTS.ORDERS.PLACE,
      data
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to place order');
  },

  /**
   * Get Order History
   * GET /customers/orders
   */
  async getOrderHistory(): Promise<Order[]> {
    const response = await apiClient.get<ApiResponse<Order[]>>(
      API_CONFIG.ENDPOINTS.ORDERS.LIST
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
    const response = await apiClient.get<ApiResponse<Order>>(
      API_CONFIG.ENDPOINTS.ORDERS.BY_ID(id)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to fetch order details');
  },

  /**
   * Cancel Order
   * POST /customers/orders/:id/cancel
   */
  async cancelOrder(id: number): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(
      API_CONFIG.ENDPOINTS.ORDERS.CANCEL(id)
    );
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error || 'Failed to cancel order');
  },
};
 