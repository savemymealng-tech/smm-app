/**
 * API Response Types
 * Complete type definitions for SaveMyMeal API v2.0.0
 */

// ============================================
// COMMON TYPES
// ============================================

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  id: number;
  name: string;
  description: string;
  is_featured?: boolean;
  display_order?: number;
  createdAt: string;
}

// ============================================
// VENDOR TYPES
// ============================================

export interface VendorUser {
  id: number;
  username: string;
  email: string;
}

export interface Vendor {
  id: number;
  business_name: string;
  address: string;
  city: string;
  phone: string;
  logo: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  latitude: string;
  longitude: string;
  rating: string;
  total_orders: number;
  distance?: string;
  user?: VendorUser;
}

// ============================================
// MEAL/PRODUCT TYPES
// ============================================

export interface Meal {
  id: number;
  vendor_id: number;
  name: string;
  description: string;
  price: string;
  original_price?: string;
  quantity_available: number;
  expiry_date: string;
  photo_url: string;
  weight?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  is_available: boolean;
  is_featured: boolean;
  createdAt: string;
  updatedAt: string;
  categories: Category[];
  vendor: Vendor;
  distance?: string;
}

export interface BrowseMealsParams {
  search?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  min_price?: number;
  max_price?: number;
  category?: string;
  categories?: string;
  dietary_preferences?: string;
  tags?: string;
  available_only?: boolean;
  expiring_soon?: boolean;
  vendor_id?: number;
  vendor_rating_min?: number;
  sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'distance' | 'expiry_date' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  include_expired?: boolean;
  include_out_of_stock?: boolean;
}

// ============================================
// VENDOR SEARCH TYPES
// ============================================

export interface NearbyVendorsParams {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
}

export interface SearchVendorsParams {
  city: string;
  latitude?: number;
  longitude?: number;
  limit?: number;
}

// ============================================
// CART TYPES
// ============================================

export interface CartProduct {
  id: number;
  name: string;
  price: string;
  photo_url: string;
  quantity_available: number;
  vendor_id?: number;
  vendor?: {
    id: number;
    business_name: string;
  };
}

export interface CartItem {
  product_id: number;
  quantity: number;
  product: CartProduct;
}

export interface Cart {
  items: CartItem[];
  total_items: number;
  subtotal: string;
  delivery_fee?: string;
  service_fee?: string;
  tax?: string;
}

export interface AddToCartRequest {
  product_id: number;
  quantity: number;
}

export interface UpdateCartRequest {
  product_id: number;
  quantity: number;
}

export interface RemoveFromCartRequest {
  product_id: number;
}

// ============================================
// ORDER TYPES
// ============================================

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  postal_code?: string;
  phone: string;
  additional_info?: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: string;
  subtotal: string;
  product: {
    id: number;
    name: string;
    photo_url: string;
  };
}

export interface Order {
  id: number;
  customer_id: number;
  vendor_id: number;
  total_amount: string;
  delivery_fee: string;
  service_fee: string;
  delivery_address: DeliveryAddress;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled' | 'rejected';
  payment_method: 'card' | 'cash' | 'transfer';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  special_instructions?: string;
  estimated_delivery_time?: string;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: number;
    business_name: string;
    logo: string;
    phone?: string;
    address?: string;
  };
  items: OrderItem[];
}

export interface PlaceOrderRequest {
  items: {
    product_id: number;
    quantity: number;
  }[];
  delivery_address: DeliveryAddress;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface InitializePaymentRequest {
  orderId: number;
  email: string;
}

export interface InitializePaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaymentVerification {
  reference: string;
  amount: string;
  status: 'success' | 'failed' | 'abandoned';
  paid_at: string;
  channel: 'card' | 'bank' | 'ussd' | 'qr' | 'mobile_money';
  order: {
    id: number;
    payment_status: string;
    status: string;
  };
}

export interface PaymentHistory {
  id: number;
  order_id: number;
  reference: string;
  amount: string;
  status: string;
  payment_channel: string;
  paid_at: string;
  createdAt: string;
}

// ============================================
// FEATURED CONTENT TYPES
// ============================================

export interface FeaturedCategory extends Category {
  is_featured: true;
  display_order: number;
}

export interface FeaturedProduct extends Meal {
  is_featured: true;
}

export interface FeaturedVendor extends Vendor {
  is_featured: true;
}
