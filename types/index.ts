export type User = {
  id: string
  email?: string
  name?: string
  full_name?: string
  first_name?: string
  last_name?: string
  username?: string
  phone?: string
  city?: string
  state_id?: number
  country_id?: number
  avatar?: string
  profile_picture_url?: string
  addresses?: Address[]
  paymentMethods?: PaymentMethod[]
  createdAt?: string
  updatedAt?: string
}

export type Address = {
  id: string
  user_id?: number
  type: 'home' | 'work' | 'other'
  street: string
  city: string
  stateId: number
  state?: {
    id: number
    name: string
  }
  zipCode: string
  countryId: number
  country?: {
    id: number
    name: string
  }
  latitude?: number
  longitude?: number
  isDefault?: boolean
  createdAt?: string
  updatedAt?: string
}

export type PaymentMethod = {
  id: string
  type: 'card' | 'apple_pay' | 'google_pay'
  provider?: 'stripe' | 'paystack'
  last4?: string
  brand?: 'visa' | 'mastercard' | 'amex'
  expiryMonth?: number
  expiryYear?: number
  isDefault?: boolean
}

export type Category = {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
}

export type Vendor = {
  id: string
  business_name: string
  description: string
  logo: string
  coverImage?: string
  rating: number
  reviewCount: number
  deliveryTime: number
  deliveryFee: number
  minOrder: number
  cuisine: string[]
  address: string
  latitude: number
  longitude: number
  isOpen: boolean
  isVerified: boolean
  featured: boolean
  distance?: number
}

export type Product = {
  id: string
  vendorId: string
  name: string
  description: string
  images: string[]
  price: number
  originalPrice?: number
  category: string
  cuisine?: string
  isAvailable: boolean
  stockCount?: number
  rating: number
  reviewCount: number
  preparationTime?: number
  calories?: number
  delivery_fee?: string
  available_for_pickup?: boolean
  available_for_delivery?: boolean
  pickup_start_time?: string
  pickup_end_time?: string
  pickup_day?: 'today' | 'tomorrow'
  delivery_time_minutes?: number
  ingredients?: string[]
  allergens?: string[]
  customizations?: Customization[]
}

export type Customization = {
  id: string
  name: string
  type: 'single' | 'multiple' | 'quantity'
  required: boolean
  options: CustomizationOption[]
}

export type CustomizationOption = {
  id: string
  name: string
  price: number
}

export type CartItem = {
  id: string
  productId: string
  vendorId: string
  product: Product
  quantity: number
  customizations: Record<string, string[]>
  notes?: string
  unitPrice: number
  totalPrice: number
  fulfillment_method?: 'pickup' | 'delivery' | null
  requires_fulfillment_choice?: boolean
}

export type Cart = {
  items: CartItem[]
  vendorId?: string
  vendorName?: string
  subtotal: number
  deliveryFee: number
  tax: number
  discount: number
  total: number
}

export type CartTotals = {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
};

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'rejected'
  | 'accepted'
  | 'completed';

export type Order = {
  id: string
  userId: string
  vendorId: string
  vendor: Vendor
  items: OrderItem[]
  status: OrderStatus
  address: Address
  paymentMethod: PaymentMethod
  subtotal: number
  deliveryFee: number
  tax: number
  discount: number
  total: number
  promoCode?: string
  notes?: string
  estimatedDeliveryTime: string
  actualDeliveryTime?: string
  rating?: number
  review?: string
  createdAt: string
  updatedAt: string
}

export type OrderItem = {
  id: string
  productId: string
  product: Product
  quantity: number
  customizations: Record<string, string[]>
  notes?: string
  unitPrice: number
  totalPrice: number
}

export type PromoCode = {
  code: string
  discount: number
  type: 'percentage' | 'fixed'
  minOrder?: number
  maxDiscount?: number
  validUntil?: string
}

export type Filter = {
  categories?: string[]
  priceRange?: [number, number]
  minRating?: number
  maxDeliveryTime?: number
  cuisine?: string[]
  isOpen?: boolean
}

export type SortOption = 'relevance' | 'distance' | 'rating' | 'deliveryTime' | 'priceLow' | 'priceHigh'

export type VendorParams = Filter & {
  featured?: boolean;
  limit?: number;
  sort?: SortOption;
};

export type Notification = {
  id: string
  userId: string
  type: 'order' | 'promotion' | 'recommendation' | 'system'
  title: string
  body: string
  data?: Record<string, any>
  read: boolean
  createdAt: string
}

export type SearchResult = {
  vendors: Vendor[]
  products: Product[]
  total: number
}

