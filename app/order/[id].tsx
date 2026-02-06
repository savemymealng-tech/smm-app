import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { PaystackWebView } from '@/components/ui/paystack-webview';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useCancelOrder, useReorder, useTrackOrder } from '@/lib/hooks';
import { useOrders } from '@/lib/hooks/use-orders';
import { useInitializePayment, useVerifyPayment } from '@/lib/hooks/usePayments';
import { getImageSource } from '@/lib/utils';
import type { DeliveryAddress, Order, OrderItem } from '@/types/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

const parseDeliveryAddress = (address: string | DeliveryAddress): DeliveryAddress => {
  if (typeof address === 'string') {
    try {
      return JSON.parse(address);
    } catch {
      return {} as DeliveryAddress;
    }
  }
  return address;
};

const getOrderItems = (order: Order): OrderItem[] => order.orderItems || order.items || [];

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-100',
  accepted: 'text-blue-600 bg-blue-100',
  confirmed: 'text-blue-600 bg-blue-100',
  preparing: 'text-purple-600 bg-purple-100',
  ready: 'text-green-600 bg-green-100',
  on_the_way: 'text-orange-600 bg-orange-100',
  delivered: 'text-green-600 bg-green-100',
  completed: 'text-emerald-600 bg-emerald-100',
  cancelled: 'text-red-600 bg-red-100',
  rejected: 'text-red-600 bg-red-100',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  on_the_way: 'On the Way',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const getStatusBadgeClass = (status: string): string =>
  STATUS_COLORS[status] || 'text-gray-600 bg-gray-100';

const getStatusLabel = (status: string): string => STATUS_LABELS[status] || status;

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

type OrderViewData =
  | { type: 'single'; order: Order }
  | {
      type: 'group';
      group: { order_group_id: string; orders: Order[]; grand_total: string };
    };

// ────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────

function OrderHeader({
  isGroup,
  orderId,
  status,
  onCancelPress,
  isCancelling,
}: {
  isGroup: boolean;
  orderId: string;
  status?: string;
  onCancelPress: () => void;
  isCancelling: boolean;
}) {
  const router = useRouter();

  return (
    <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
      <View className="flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <IconSymbol name="arrow.left" size={24} color="#000" />
        </Pressable>
        <Text className="text-xl font-bold">Order Details</Text>
      </View>

      {!isGroup && status === 'pending' && (
        <Button
          onPress={onCancelPress}
          disabled={isCancelling}
          className="bg-red-600"
        >
          {isCancelling ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white">Cancel</Text>
          )}
        </Button>
      )}
    </View>
  );
}

function OrderStatusCard({
  isGroup,
  groupId,
  singleOrder,
  orders,
}: {
  isGroup: boolean;
  groupId?: string;
  singleOrder?: Order;
  orders: Order[];
}) {
  const displayOrder = isGroup ? orders[0] : singleOrder;
  if (!displayOrder) return null;

  const uniqueStatuses = isGroup ? [...new Set(orders.map((o) => o.status))] : [displayOrder.status];
  const vendorCount = isGroup ? new Set(orders.map((o) => o.vendor?.business_name)).size : 1;

  return (
    <View className="bg-white p-5 mb-4 mx-4 mt-4 rounded-xl shadow-sm">
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold">
          {isGroup ? `Group Order ${groupId}` : `Order #${displayOrder.id}`}
        </Text>

        {!isGroup && (
          <View className={`px-3 py-1 rounded-full ${getStatusBadgeClass(displayOrder.status)}`}>
            <Text className="text-sm font-medium">{getStatusLabel(displayOrder.status)}</Text>
          </View>
        )}
      </View>

      {isGroup && (
        <View className="mb-4">
          <Text className="text-gray-600 mb-2">
            {orders.length} order{orders.length !== 1 ? 's' : ''} from {vendorCount} vendor
            {vendorCount !== 1 ? 's' : ''}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {uniqueStatuses.map((status) => (
              <View
                key={status}
                className={`px-3 py-1 rounded-full ${getStatusBadgeClass(status)}`}
              >
                <Text className="text-xs font-medium">{getStatusLabel(status)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className="flex-row items-center mb-2">
        <IconSymbol name="calendar" size={16} color="#666" />
        <Text className="ml-2 text-gray-600">Ordered: {formatDate(displayOrder.createdAt)}</Text>
      </View>

      {displayOrder.status === 'delivered' && (
        <View className="flex-row items-center mt-1">
          <IconSymbol name="checkmark.circle.fill" size={16} color="#10b981" />
          <Text className="ml-2 text-gray-600">Delivered</Text>
        </View>
      )}

      {displayOrder.estimated_delivery_time && displayOrder.status !== 'delivered' && (
        <View className="flex-row items-center mt-2">
          <IconSymbol name="clock" size={16} color="#F39C12" />
          <Text className="ml-2 text-gray-600">
            Est. delivery: {formatDate(displayOrder.estimated_delivery_time)}
          </Text>
        </View>
      )}
      
      {/* Payment Failed Warning */}
      {(() => {
        if (isGroup) {
          // Check if there's a group payment that failed
          const groupPayment = orders.find(o => o.payment?.order_group_id)?.payment;
          if (groupPayment?.status === 'failed') {
            return (
              <View className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <View className="flex-row items-center mb-2">
                  <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#dc2626" />
                  <Text className="ml-2 text-red-700 font-semibold text-sm">Payment Failed</Text>
                </View>
                <Text className="text-red-600 text-xs">
                  Payment for this group order has failed. Please retry payment to complete your orders.
                </Text>
              </View>
            );
          }
          // Check if group payment doesn't exist (not initialized)
          if (!groupPayment && orders.some(o => o.payment_method === 'card')) {
            return (
              <View className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <View className="flex-row items-center mb-2">
                  <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#dc2626" />
                  <Text className="ml-2 text-red-700 font-semibold text-sm">Payment Required</Text>
                </View>
                <Text className="text-red-600 text-xs">
                  Payment has not been initialized. Please retry payment to complete your orders.
                </Text>
              </View>
            );
          }
        } else {
          // Single order
          if (displayOrder.payment_method === 'card') {
            if (!displayOrder.payment) {
              return (
                <View className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <View className="flex-row items-center mb-2">
                    <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#dc2626" />
                    <Text className="ml-2 text-red-700 font-semibold text-sm">Payment Initialization Failed</Text>
                  </View>
                  <Text className="text-red-600 text-xs">
                    Payment could not be initialized. Please retry payment to complete your order.
                  </Text>
                </View>
              );
            }
            if (displayOrder.payment.status === 'failed') {
              return (
                <View className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <View className="flex-row items-center mb-2">
                    <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#dc2626" />
                    <Text className="ml-2 text-red-700 font-semibold text-sm">Payment Failed</Text>
                  </View>
                  <Text className="text-red-600 text-xs">
                    Payment has failed. Please retry payment to complete your order.
                  </Text>
                </View>
              );
            }
          }
        }
        return null;
      })()}
    </View>
  );
}

function VendorSection({ order }: { order: Order }) {
  const router = useRouter();
  
  return (
    <View className="bg-white p-5 mb-4 rounded-xl shadow-sm">
      <Pressable 
        onPress={() => router.push(`/vendor/${order.vendor_id}` as any)}
        className="flex-row items-center justify-between"
      >
        <View className="flex-row items-center flex-1">
          <Image
            source={getImageSource(order.vendor?.logo) || require('@/assets/images/default-profile.jpg')}
            className="w-12 h-12 rounded-full mr-3"
            resizeMode="cover"
          />
          <View className="flex-1">
            <Text className="font-semibold text-base">{order.vendor?.business_name || 'Vendor'}</Text>
            <Text className="text-gray-600 text-sm">{order.vendor?.phone || '—'}</Text>
          </View>
        </View>

        <View className={`px-3 py-1 rounded-full ${getStatusBadgeClass(order.status)}`}>
          <Text className="text-xs font-medium">{getStatusLabel(order.status)}</Text>
        </View>
      </Pressable>

      <View className="border-t border-gray-100 mt-4 pt-4">
        <Text className="text-sm font-semibold mb-3 text-gray-700">
          Items ({getOrderItems(order).length})
        </Text>

        {getOrderItems(order).map((item, idx) => (
          <Pressable
            key={item.id}
            onPress={() => router.push(`/product/${item.product_id}` as any)}
            className={`flex-row py-3 ${idx < getOrderItems(order).length - 1 ? 'border-b border-gray-50' : ''}`}
          >
            <Image
              source={getImageSource(item.product.photo_url) || require('@/assets/images/default-product.jpg')}
              className="w-14 h-14 rounded-lg mr-3"
              resizeMode="cover"
            />
            <View className="flex-1">
              <View className="flex-row justify-between items-start mb-1">
                <Text className="font-medium flex-1 text-sm pr-2" numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text className="font-semibold text-sm">₦{Number(item.price).toFixed(0)}</Text>
              </View>
              <Text className="text-gray-500 text-xs">Qty: {item.quantity}</Text>
            </View>
          </Pressable>
        ))}

        <View className="flex-row justify-between mt-4 pt-3 border-t border-gray-100">
          <Text className="text-sm text-gray-600">Order Total</Text>
          <Text className="font-semibold">₦{Number(order.total_amount).toFixed(0)}</Text>
        </View>
      </View>
    </View>
  );
}

function SingleOrderItems({ order }: { order: Order }) {
  return (
    <View className="bg-white p-5 mb-4 mx-4 rounded-xl shadow-sm">
      <Text className="text-lg font-semibold mb-4">Items ({getOrderItems(order).length})</Text>

      {getOrderItems(order).map((item, idx) => (
        <View
          key={item.id}
          className={`flex-row py-3 ${idx < getOrderItems(order).length - 1 ? 'border-b border-gray-100' : ''}`}
        >
          <Image
            source={getImageSource(item.product.photo_url) || require('@/assets/images/default-product.jpg')}
            className="w-16 h-16 rounded-lg mr-3"
            resizeMode="cover"
          />
          <View className="flex-1">
            <View className="flex-row justify-between items-start mb-1">
              <Text className="font-semibold flex-1 pr-2" numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text className="font-bold">₦{Number(item.price).toFixed(0)}</Text>
            </View>
            <Text className="text-gray-600 text-sm">Qty: {item.quantity}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function DeliveryAddressCard({ address }: { address: string | DeliveryAddress }) {
  const parsed = parseDeliveryAddress(address);

  const fullAddress = [
    parsed.street,
    parsed.city,
    typeof parsed.state === 'string' ? parsed.state : parsed.state?.name,
    parsed.postal_code,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View className="bg-white p-5 mb-4 mx-4 rounded-xl shadow-sm">
      <Text className="text-lg font-semibold mb-3">Delivery Address</Text>
      <View className="flex-row items-start">
        <View className="mt-1">
          <IconSymbol name="location.fill" size={20} color="#666" />
        </View>
        <Text className="ml-3 text-gray-700 flex-1">
          {fullAddress || 'No address provided'}
        </Text>
      </View>
    </View>
  );
}

function PaymentSummary({
  isGroup,
  orders,
  groupTotal,
}: {
  isGroup: boolean;
  orders: Order[];
  groupTotal: string;
}) {
  const calculateSubtotal = (order: Order) =>
    getOrderItems(order).reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  return (
    <View className="bg-white p-5 mb-4 mx-4 rounded-xl shadow-sm">
      <Text className="text-lg font-semibold mb-4">Payment Summary</Text>

      {isGroup ? (
        <>
          {orders.map((order) => (
            <View
              key={order.id}
              className="mb-5 pb-4 border-b border-gray-100 last:border-0 last:pb-0 last:mb-0"
            >
              <Text className="text-xs text-gray-500 mb-2">{order.vendor?.business_name}</Text>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-gray-600 text-sm">Subtotal</Text>
                <Text className="text-sm">₦{calculateSubtotal(order).toFixed(0)}</Text>
              </View>
              <View className="flex-row justify-between mb-1.5">
                <Text className="text-gray-600 text-sm">Delivery Fee</Text>
                <Text className="text-sm">₦{Number(order.delivery_fee || 0).toFixed(0)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600 text-sm">Service Fee</Text>
                <Text className="text-sm">₦{Number(order.service_fee || 0).toFixed(0)}</Text>
              </View>
            </View>
          ))}

          <View className="pt-3">
            <View className="flex-row justify-between mb-4">
              <Text className="text-lg font-bold">Grand Total</Text>
              <Text className="text-lg font-bold">₦{Number(groupTotal).toFixed(0)}</Text>
            </View>
            <View className="flex-row items-center">
              <IconSymbol name="creditcard.fill" size={16} color="#666" />
              <Text className="ml-2 text-gray-600 uppercase">
                {orders[0]?.payment_method || '—'}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <SinglePaymentSummary order={orders[0]} />
      )}
    </View>
  );
}

function SinglePaymentSummary({ order }: { order: Order }) {
  const subtotal = getOrderItems(order).reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  return (
    <>
      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">Subtotal</Text>
        <Text className="font-medium">₦{subtotal.toFixed(0)}</Text>
      </View>
      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">Delivery Fee</Text>
        <Text className="font-medium">₦{Number(order.delivery_fee || 0).toFixed(0)}</Text>
      </View>
      <View className="flex-row justify-between mb-4">
        <Text className="text-gray-600">Service Fee</Text>
        <Text className="font-medium">₦{Number(order.service_fee || 0).toFixed(0)}</Text>
      </View>

      <View className="border-t border-gray-200 pt-4">
        <View className="flex-row justify-between mb-4">
          <Text className="text-lg font-bold">Total</Text>
          <Text className="text-lg font-bold">₦{Number(order.total_amount).toFixed(0)}</Text>
        </View>
        <View className="flex-row items-center">
          <IconSymbol name="creditcard.fill" size={16} color="#666" />
          <Text className="ml-2 text-gray-600 uppercase">{order.payment_method || '—'}</Text>
        </View>
      </View>
    </>
  );
}

function ActionSection({
  isGroup,
  orders,
  onReorder,
  isReordering,
}: {
  isGroup: boolean;
  orders: Order[];
  onReorder: (order?: Order) => void;
  isReordering: boolean;
}) {
  const router = useRouter();

  if (isGroup) {
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');
    if (deliveredOrders.length === 0) return null;

    return (
      <View className="px-4 pb-10">
        {deliveredOrders.map((order) => (
          <View key={order.id} className="bg-white rounded-xl p-5 mb-4 shadow-sm">
            <Text className="text-base font-semibold mb-4">{order.vendor?.business_name}</Text>
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                onPress={() => onReorder(order)}
                disabled={isReordering}
                className="flex-1"
              >
                {isReordering ? (
                  <ActivityIndicator size="small" color="#15785B" />
                ) : (
                  <Text className="text-primary text-sm">Reorder</Text>
                )}
              </Button>
              <Button
                onPress={() => router.push(`/order/${order.id}/review` as any)}
                className="flex-1"
              >
                <Text className="text-white text-sm">Review</Text>
              </Button>
            </View>
          </View>
        ))}
      </View>
    );
  }

  const order = orders[0];
  if (order.status !== 'delivered') return null;

  return (
    <View className="px-4 pb-10">
      <View className="bg-white rounded-xl p-6 mb-4 shadow-sm">
        <Text className="text-lg font-semibold mb-2 text-center">Order Again?</Text>
        <Text className="text-gray-600 text-center mb-5">Add the same items to your cart</Text>

        <Button variant="outline" onPress={() => onReorder()} disabled={isReordering}>
          {isReordering ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#15785B" />
              <Text className="ml-2 text-primary">Adding to cart...</Text>
            </View>
          ) : (
            <View className="flex-row items-center justify-center">
              <IconSymbol name="arrow.clockwise" size={18} color="#15785B" />
              <Text className="ml-2 text-primary">Reorder</Text>
            </View>
          )}
        </Button>
      </View>

      <View className="bg-white rounded-xl p-6 shadow-sm">
        <Text className="text-lg font-semibold mb-2 text-center">Rate Your Order</Text>
        <Text className="text-gray-600 text-center mb-5">Help others by sharing your experience</Text>
        <Button onPress={() => router.push(`/order/${order.id}/review` as any)}>
          <Text className="text-white">Leave Review</Text>
        </Button>
      </View>
    </View>
  );
}

// Retry Payment Section
function RetryPaymentSection({
  order,
  onRetryPayment,
  isRetrying,
  showVendorInfo = false,
}: {
  order: Order;
  onRetryPayment: () => void;
  isRetrying: boolean;
  showVendorInfo?: boolean;
}) {
  // Only show for card payments where payment initialization failed or status is failed
  if (order.payment_method !== 'card') return null;
  if (order.payment && order.payment.status !== 'failed') return null;

  return (
    <View className="pb-4">
      <View className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
        <View className="flex-row items-center justify-center mb-2">
          <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#dc2626" />
          <Text className="text-lg font-semibold ml-2 text-red-700">Payment Required</Text>
        </View>
        {showVendorInfo && order.vendor && (
          <Text className="text-center text-sm text-gray-600 mb-2">
            {order.vendor.business_name} - Order #{order.id}
          </Text>
        )}
        <Text className="text-gray-600 text-center mb-5">
          Payment initialization failed. Retry to complete your order.
        </Text>

        <Button onPress={onRetryPayment} disabled={isRetrying} className="bg-red-600">
          {isRetrying ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" />
              <Text className="ml-2 text-white">Initializing Payment...</Text>
            </View>
          ) : (
            <View className="flex-row items-center justify-center">
              <IconSymbol name="creditcard.fill" size={18} color="white" />
              <Text className="ml-2 text-white font-semibold">Retry Payment</Text>
            </View>
          )}
        </Button>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const isGroupId = id?.startsWith('OG') || id?.startsWith('single-');

  const { data: ordersList = [] } = useOrders();

  const {
    data: singleOrder,
    isLoading: isLoadingSingle,
    refetch: refetchSingle,
  } = useTrackOrder(id || '', {
    enabled: !isGroupId && !!id,
  });

  const cancelOrder = useCancelOrder();
  const reorder = useReorder();
  const initializePayment = useInitializePayment();
  const verifyPayment = useVerifyPayment();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  const orderData = useMemo<OrderViewData | null>(() => {
    if (!isGroupId) {
      return singleOrder ? { type: 'single', order: singleOrder } : null;
    }

    const match = ordersList.find((item: any) => {
      return item.order_group_id === id || `single-${item.id}` === id;
    }) as any;

    if (!match) return null;

    // Check if it's a grouped order (has orders array)
    if ('orders' in match && Array.isArray(match.orders)) {
      return {
        type: 'group',
        group: {
          order_group_id: match.order_group_id || '',
          orders: match.orders as Order[],
          grand_total: match.grand_total || '0',
        },
      };
    }

    return { type: 'single', order: match as Order };
  }, [isGroupId, id, ordersList, singleOrder]);

  if (isGroupId ? ordersList.length === 0 : isLoadingSingle) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <Skeleton className="w-32 h-6" />
        </View>
        <View className="p-4">
          <Skeleton className="w-full h-64 rounded-2xl mb-4" />
          <Skeleton className="w-full h-32 rounded-2xl" />
        </View>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View
        className="flex-1 items-center justify-center bg-gray-50"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-xl font-semibold mb-4">Order not found</Text>
        <Button onPress={() => router.back()}>
          <Text className="text-white">Go Back</Text>
        </Button>
      </View>
    );
  }

  const isGroup = orderData.type === 'group';
  const orders = isGroup ? orderData.group.orders : [orderData.order];
  const displayOrder = orders[0];
  const groupTotal = isGroup ? orderData.group.grand_total : orderData.order.total_amount;

  const handleCancelRequest = () => {
    if (displayOrder.status !== 'pending') {
      toast.warning('Cannot Cancel', 'Only pending orders can be cancelled.');
      return;
    }
    setCancelDialogOpen(true);
  };

  const confirmCancel = () => {
    if (orderData.type === 'single') {
      cancelOrder.mutate(String(orderData.order.id), {
        onSuccess: () => refetchSingle(),
      });
    }
    setCancelDialogOpen(false);
  };

  const handleRetryPayment = async (orderId?: number) => {
    // For grouped orders, use orderGroupId; for single orders, use orderId
    const targetOrder = orderId ? orders.find(o => o.id === orderId) : displayOrder;
    
    if (!targetOrder?.Customer?.email) {
      toast.error('Error', 'Customer email not found');
      return;
    }

    // Check if payment has order_group_id (regardless of current isGroup detection)
    const paymentGroupId = targetOrder.payment?.order_group_id || targetOrder.order_group_id;
    
    // Determine if this is a grouped order payment
    const isGroupedPayment = (isGroup && !orderId) || (!!paymentGroupId && !orderId);
    const orderGroupId = paymentGroupId;

    initializePayment.mutate(
      isGroupedPayment && orderGroupId
        ? {
            orderGroupId,
            email: targetOrder.Customer.email,
            callbackUrl: 'savemymeal://payment/callback',
          }
        : {
            orderId: targetOrder.id,
            email: targetOrder.Customer.email,
            callbackUrl: 'savemymeal://payment/callback',
          },
      {
        onSuccess: (data) => {
          console.log('Payment initialization success:', {
            authorization_url: data.authorization_url,
            reference: data.reference,
          });
          setPaymentUrl(data.authorization_url);
          setPaymentReference(data.reference);
        },
        onError: (error: any) => {
          console.error('Payment initialization error:', error);
          toast.error('Payment Failed', error.message || 'Failed to initialize payment');
        },
      }
    );
  };

  const handlePaymentSuccess = useCallback(async () => {
    if (!paymentReference) return;

    try {
      await verifyPayment.mutateAsync(paymentReference);
      toast.success('Payment Successful', 'Your payment has been confirmed');
      setPaymentUrl(null);
      setPaymentReference(null);
      refetchSingle();
      router.push('/orders');
    } catch (error: any) {
      toast.error('Verification Failed', error.message || 'Could not verify payment');
    }
  }, [paymentReference, verifyPayment, refetchSingle, router]);

  const handlePaymentCancel = useCallback(() => {
    setPaymentUrl(null);
    setPaymentReference(null);
    toast.warning('Payment Cancelled', 'You can retry payment anytime');
  }, []);

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Fixed Header */}
      <OrderHeader
        isGroup={isGroup}
        orderId={id}
        status={displayOrder.status}
        onCancelPress={handleCancelRequest}
        isCancelling={cancelOrder.isPending}
      />

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 60,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        <OrderStatusCard
          isGroup={isGroup}
          groupId={id}
          singleOrder={orderData.type === 'single' ? orderData.order : undefined}
          orders={orders}
        />

        {isGroup ? (
          <View className="px-4">
            {orders.map((order) => (
              <VendorSection key={order.id} order={order} />
            ))}
          </View>
        ) : (
          <>
            {/* Single order vendor info */}
            <View className="bg-white p-5 mb-4 mx-4 rounded-xl shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Image
                    source={
                      getImageSource(displayOrder.vendor?.logo) ||
                      require('@/assets/images/default-profile.jpg')
                    }
                    className="w-12 h-12 rounded-full mr-3"
                    resizeMode="cover"
                  />
                  <View>
                    <Text className="font-semibold text-base">
                      {displayOrder.vendor?.business_name || 'Vendor'}
                    </Text>
                    <Text className="text-gray-600">{displayOrder.vendor?.phone || '—'}</Text>
                  </View>
                </View>
                <Pressable className="bg-gray-100 rounded-full p-2.5">
                  <IconSymbol name="phone.fill" size={20} color="#666" />
                </Pressable>
              </View>
            </View>

            <SingleOrderItems order={displayOrder} />
          </>
        )}

        <DeliveryAddressCard address={displayOrder.delivery_address} />

        <PaymentSummary isGroup={isGroup} orders={orders} groupTotal={groupTotal} />

        {/* Retry Payment Section - For failed card payments */}
        {(() => {
          if (!isGroup) {
            // Single order: show retry button only if payment failed
            const hasFailedPayment = displayOrder.payment_method === 'card' && 
              (!displayOrder.payment || displayOrder.payment.status === 'failed');
            
            return hasFailedPayment ? (
              <View className="px-4">
                <RetryPaymentSection 
                  order={displayOrder} 
                  onRetryPayment={() => handleRetryPayment(displayOrder.id)}
                  isRetrying={initializePayment.isPending}
                />
              </View>
            ) : null;
          }

          // Grouped order: Find group payment (payment with order_group_id)
          const groupPayment = orders.find(o => o.payment?.order_group_id)?.payment;
          
          // If there's a group payment, check its status for the entire group
          if (groupPayment) {
            // If group payment exists and is not failed, don't show retry button
            if (groupPayment.status !== 'failed') return null;
            
            // Group payment failed - show one button for all
            return (
              <View className="px-4">
                <View className="pb-4">
                  <View className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
                    <View className="flex-row items-center justify-center mb-2">
                      <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#dc2626" />
                      <Text className="text-lg font-semibold ml-2 text-red-700">Payment Failed</Text>
                    </View>
                    <Text className="text-gray-600 text-center mb-5">
                      Retry to complete your orders.
                    </Text>

                    <Button 
                      onPress={() => handleRetryPayment()} 
                      disabled={initializePayment.isPending} 
                      className="bg-red-600"
                    >
                      {initializePayment.isPending ? (
                        <View className="flex-row items-center justify-center">
                          <ActivityIndicator size="small" color="white" />
                          <Text className="ml-2 text-white">Initializing Payment...</Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center justify-center">
                          <IconSymbol name="creditcard.fill" size={18} color="white" />
                          <Text className="ml-2 text-white font-semibold">Retry Payment (₦{Number(groupTotal).toFixed(0)})</Text>
                        </View>
                      )}
                    </Button>
                  </View>
                </View>
              </View>
            );
          }

          // No group payment - check individual orders
          const failedOrders = orders.filter(o => 
            o.payment_method === 'card' && (!o.payment || o.payment.status === 'failed')
          );
          
          if (failedOrders.length === 0) return null;

          // If ALL orders in the group failed payment, show one button to pay for all
          if (failedOrders.length === orders.length) {
            return (
              <View className="px-4">
                <View className="pb-4">
                  <View className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
                    <View className="flex-row items-center justify-center mb-2">
                      <IconSymbol name="exclamationmark.triangle.fill" size={20} color="#dc2626" />
                      <Text className="text-lg font-semibold ml-2 text-red-700">Payment Required</Text>
                    </View>

                    <Text className="text-gray-600 text-center mb-5">
                      Payment initialization failed. Retry to complete your orders.
                    </Text>

                    <Button 
                      onPress={() => handleRetryPayment()} 
                      disabled={initializePayment.isPending} 
                      className="bg-red-600"
                    >
                      {initializePayment.isPending ? (
                        <View className="flex-row items-center justify-center">
                          <ActivityIndicator size="small" color="white" />
                          <Text className="ml-2 text-white">Initializing Payment...</Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center justify-center">
                          <IconSymbol name="creditcard.fill" size={18} color="white" />
                          <Text className="ml-2 text-white font-semibold">Pay All Orders (₦{Number(groupTotal).toFixed(0)})</Text>
                        </View>
                      )}
                    </Button>
                  </View>
                </View>
              </View>
            );
          }

          // If SOME orders failed payment, show individual retry buttons
          return (
            <View className="px-4">
              {failedOrders.map((order) => (
                <View key={order.id} className="mb-4">
                  <RetryPaymentSection 
                    order={order} 
                    onRetryPayment={() => handleRetryPayment(order.id)}
                    isRetrying={initializePayment.isPending}
                    showVendorInfo={true}
                  />
                </View>
              ))}
            </View>
          );
        })()}

        <ActionSection
          isGroup={isGroup}
          orders={orders}
          onReorder={(ord?: Order) => reorder.mutate(ord || displayOrder)}
          isReordering={reorder.isPending}
        />

        {/* Extra bottom space */}
        <View className="h-10" />
      </ScrollView>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>No</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={confirmCancel} className="bg-red-600">
              <Text className="text-white">Yes, Cancel</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Paystack Payment WebView */}
      {useMemo(
        () =>
          paymentUrl && paymentReference ? (
            <PaystackWebView
              visible={true}
              authorizationUrl={paymentUrl}
              reference={paymentReference}
              onClose={handlePaymentCancel}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentCancel={handlePaymentCancel}
            />
          ) : null,
        [paymentUrl, paymentReference, handlePaymentCancel, handlePaymentSuccess]
      )}
    </View>
  );
}
