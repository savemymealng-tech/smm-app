/**
 * Orders API Service
 * Handles order management endpoints
 */

import apiClient, { extractData, ApiResponse } from './client';
import { API_CONFIG } from './config';
import type { Order } from '../../types';

export interface PlaceOrderRequest {
  vendorId: string;
  items: Array<{
    productId: string;
    quantity: number;
    customizations?: Record<string, string[]>;
    notes?: string;
  }>;
  addressId: string;
  paymentMethodId: string;
  promoCode?: string;
  notes?: string;
}

export interface OrderHistoryParams {
  status?: string;
  page?: number;
  limit?: number;
}

export const ordersApi = {
  /**
   * Place a new order
   */
  async placeOrder(data: PlaceOrderRequest): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.ORDERS,
      data
    );
    return extractData(response);
  },

  /**
   * Get order history
   */
  async getOrderHistory(params?: OrderHistoryParams): Promise<{
    orders: Order[];
    pagination?: ApiResponse['pagination'];
  }> {
    const response = await apiClient.get<ApiResponse<{
      orders: Order[];
      pagination?: ApiResponse['pagination'];
    }>>(API_CONFIG.ENDPOINTS.CUSTOMERS.ORDERS, { params });
    
    const data = extractData(response);
    return {
      orders: data.orders || [],
      pagination: data.pagination,
    };
  },

  /**
   * Track a specific order
   */
  async trackOrder(orderId: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.ORDER_BY_ID(orderId)
    );
    return extractData(response);
  },

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.CANCEL_ORDER(orderId)
    );
    return extractData(response);
  },
};

