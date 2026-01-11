/**
 * Cart API Service
 * Handles shopping cart management endpoints
 */

import apiClient, { extractData, ApiResponse } from './client';
import { API_CONFIG } from './config';
import type { CartItem, Cart } from '../../types';

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  customizations?: Record<string, string[]>;
  notes?: string;
}

export interface UpdateCartItemRequest {
  itemId: string;
  quantity: number;
}

export interface RemoveCartItemRequest {
  itemId: string;
}

export const cartApi = {
  /**
   * Add item to cart
   */
  async addToCart(data: AddToCartRequest): Promise<Cart> {
    const response = await apiClient.post<ApiResponse<Cart>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.CART,
      data
    );
    return extractData(response);
  },

  /**
   * Get customer cart
   */
  async getCart(): Promise<Cart> {
    const response = await apiClient.get<ApiResponse<Cart>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.CART
    );
    return extractData(response);
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(data: UpdateCartItemRequest): Promise<Cart> {
    const response = await apiClient.put<ApiResponse<Cart>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.CART_ITEM,
      data
    );
    return extractData(response);
  },

  /**
   * Remove item from cart
   */
  async removeFromCart(itemId: string): Promise<Cart> {
    const response = await apiClient.delete<ApiResponse<Cart>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.CART_ITEM,
      { data: { itemId } }
    );
    return extractData(response);
  },

  /**
   * Clear customer cart
   */
  async clearCart(): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      API_CONFIG.ENDPOINTS.CUSTOMERS.CART
    );
  },
};

