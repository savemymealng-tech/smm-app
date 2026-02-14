import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';

import { useOrders } from '@/lib/hooks/use-orders';
import { useReorder } from '@/lib/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';

import type { Order } from '@/types/api';

// ────────────────────────────────────────────────
// Types (aligned with your backend response)
// ────────────────────────────────────────────────

type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled' | 'rejected';

interface OrderGroup {
  order_group_id: string;
  orders: Order[];
  total_orders: number;
  grand_total: string;
  created_at: string;
  all_statuses: OrderStatus[];
  payment_method?: string;
}

type DisplayGroup = OrderGroup;

// Status mappings
type FilterStatus = 'all' | 'active' | OrderStatus;

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  delivered: 'Received',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  paid: 'text-green-700 bg-green-50 border-green-200',
  success: 'text-green-700 bg-green-50 border-green-200',
  failed: 'text-red-700 bg-red-50 border-red-200',
  refunded: 'text-gray-700 bg-gray-50 border-gray-200',
  cancelled: 'text-red-700 bg-red-50 border-red-200',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Payment Pending',
  paid: 'Paid',
  success: 'Paid',
  failed: 'Payment Failed',
  refunded: 'Refunded',
  cancelled: 'Payment Cancelled',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'text-yellow-600 bg-yellow-100',
  accepted: 'text-blue-600 bg-blue-100',
  preparing: 'text-orange-600 bg-orange-100',
  ready: 'text-purple-600 bg-purple-100',
  delivered: 'text-green-600 bg-green-100',
  completed: 'text-emerald-600 bg-emerald-100',
  cancelled: 'text-red-600 bg-red-100',
  rejected: 'text-red-600 bg-red-100',
};

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: rawItems = [], isLoading } = useOrders();
  const { mutate: reorder, isPending: isReordering } = useReorder();

  const [selectedFilter, setSelectedFilter] = useState<FilterStatus>('all');

  // ────────────────────────────────────────────────
  // Normalize API response → unified groups
  // ────────────────────────────────────────────────

  const displayGroups = useMemo<DisplayGroup[]>(() => {
    return rawItems.map((item: any) => {
      // It's already a group
      if ('order_group_id' in item && 'orders' in item && Array.isArray(item.orders)) {
        return item as DisplayGroup;
      }

      // It's a single order → wrap it as a group of 1
      return {
        order_group_id: `single-${item.id}`,
        orders: [item],
        total_orders: 1,
        grand_total: item.total_amount || '0.00',
        created_at: item.createdAt,
        all_statuses: [item.status],
        payment_method: item.payment_method,
      };
    });
  }, [rawItems]);

  // ────────────────────────────────────────────────
  // Filter + counts
  // ────────────────────────────────────────────────

  const filterCounts = useMemo(() => {
    const counts: Record<'all' | OrderStatus | 'active', number> = {
      all: displayGroups.length,
      pending: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      rejected: 0,
      active: 0,
    };

    displayGroups.forEach((group) => {
      group.all_statuses.forEach((status) => {
        if (status in counts) {
          counts[status as OrderStatus]++;
        }
      });
    });

    // "active" represents orders that are being prepared or ready
    counts.active = displayGroups.filter((g) =>
      g.all_statuses.some((s) => ['accepted', 'preparing', 'ready'].includes(s))
    ).length;

    return counts;
  }, [displayGroups]);

  const visibleGroups = useMemo(() => {
    if (selectedFilter === 'all') return displayGroups;

    if (selectedFilter === 'active') {
      return displayGroups.filter((g) =>
        g.all_statuses.some((s) => ['accepted', 'preparing', 'ready'].includes(s))
      );
    }

    return displayGroups.filter((g) => g.all_statuses.includes(selectedFilter));
  }, [displayGroups, selectedFilter]);

  // ────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────

  const getStatusBadgeClass = (status: OrderStatus) =>
    STATUS_COLORS[status] ?? 'text-gray-600 bg-gray-100';

  const getStatusLabel = (status: OrderStatus) =>
    STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);

  const getPaymentStatusBadgeClass = (status: string) =>
    PAYMENT_STATUS_COLORS[status] || 'text-gray-700 bg-gray-50 border-gray-200';

  const getPaymentStatusLabel = (status: string) =>
    PAYMENT_STATUS_LABELS[status] || status;

  const formatOrderDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

  // ────────────────────────────────────────────────
  // Render helpers
  // ────────────────────────────────────────────────

  const OrderSkeleton = () => (
    <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between mb-3">
        <Skeleton className="h-5 w-32 rounded" />
        <Skeleton className="h-5 w-24 rounded" />
      </View>
      <View className="flex-row items-center mb-3">
        <Skeleton className="w-12 h-12 rounded-lg mr-3" />
        <Skeleton className="h-6 w-40 rounded" />
      </View>
      <Skeleton className="h-5 w-28 rounded mb-3" />
      <Skeleton className="h-10 w-full rounded" />
    </View>
  );

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-20">
      <IconSymbol name="bag.fill" size={80} color="#d1d5db" />
      <Text className="text-2xl font-semibold mt-6 mb-3 text-gray-800">
        No orders yet
      </Text>
      <Text className="text-gray-500 text-center leading-6 mb-10">
        {selectedFilter === 'all'
          ? "You haven't placed any orders.\nStart exploring restaurants near you!"
          : `No ${getStatusLabel(selectedFilter as OrderStatus).toLowerCase()} orders found.`}
      </Text>
      {selectedFilter === 'all' && (
        <Button size="lg" onPress={() => router.push('/(tabs)')} className="px-12">
          Browse Restaurants
        </Button>
      )}
    </View>
  );

  // ────────────────────────────────────────────────
  // Main UI
  // ────────────────────────────────────────────────

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3.5">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3 p-1">
            <IconSymbol name="arrow.left" size={24} color="#111827" />
          </Pressable>
          <Text className="text-xl font-bold text-gray-900">My Orders</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2.5 py-1">
            {[
              { key: 'all' as const, label: 'All' },
              { key: 'active' as const, label: 'Active' },
              { key: 'delivered' as const, label: 'Received' },
              { key: 'cancelled' as const, label: 'Cancelled' },
            ].map(({ key, label }) => {
              const isActive = selectedFilter === key;
              const count = filterCounts[key];

              return (
                <Pressable
                  key={key}
                  onPress={() => setSelectedFilter(key)}
                  className={`px-5 py-2.5 rounded-full border ${
                    isActive
                      ? 'bg-green-700 border-green-700'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <Text
                    className={`font-medium text-sm ${
                      isActive ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {label} {count > 0 && `(${count})`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 16, 
          paddingTop: 20, 
          paddingBottom: insets.bottom + 80 
        }}
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <OrderSkeleton key={i} />)
        ) : visibleGroups.length > 0 ? (
          visibleGroups.map((group) => {
              const isSingle = group.total_orders === 1;
              const firstOrder = group.orders[0];
              const uniqueStatuses = [...new Set(group.all_statuses)];

              return (
                <Pressable
                  key={group.order_group_id}
                  onPress={() => {
                    if (isSingle) {
                      router.push(`/order/${firstOrder.id}` as any);
                    } else {
                      router.push(`/order/${group.order_group_id}` as any);
                    }
                  }}

                  className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 active:opacity-95"
                >
                  {/* Date + Grand Total */}
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-600 text-sm">
                      {formatOrderDate(group.created_at)}
                    </Text>
                    <Text className="font-bold text-base text-gray-900">
                      {formatCurrency(Number(group.grand_total))}
                    </Text>
                  </View>

                  {/* Vendor Info / Count */}
                  {isSingle ? (
                    <View className="flex-row items-center mb-3">
                      <Image
                        source={
                          firstOrder.vendor?.logo
                            ? { uri: firstOrder.vendor.logo }
                            : require('@/assets/images/default-profile.jpg')
                        }
                        className="w-12 h-12 rounded-lg mr-3 bg-gray-100"
                        resizeMode="cover"
                      />
                      <Text className="font-semibold text-base flex-1" numberOfLines={1}>
                        {firstOrder.vendor?.business_name ?? 'Unknown Vendor'}
                      </Text>
                    </View>
                  ) : (
                    <View className="flex-row items-center mb-3">
                      <View className="bg-gray-100 rounded-full px-3.5 py-1 mr-2.5">
                        <Text className="text-xs font-medium text-gray-700">
                          {group.total_orders} vendors
                        </Text>
                      </View>
                      <Text className="text-gray-600 text-sm">Multiple restaurants</Text>
                    </View>
                  )}

                  {/* Status Badges */}
                  <View className="flex-row flex-wrap gap-1.5 mb-4">
                    {/* Show payment status for both single and group orders */}
                    {(() => {
                      if (isSingle && firstOrder.payment_status) {
                        return (
                          <View
                            className={`px-3 py-1 rounded-full border ${getPaymentStatusBadgeClass(firstOrder.payment_status)}`}
                          >
                            <Text className="text-xs font-medium">
                              {getPaymentStatusLabel(firstOrder.payment_status)}
                            </Text>
                          </View>
                        );
                      } else if (!isSingle) {
                        // For grouped orders, check for group payment status
                        const groupPayment = group.orders.find((o: any) => o.payment?.order_group_id)?.payment;
                        const paymentStatus = groupPayment?.status || group.orders[0]?.payment_status;
                        if (paymentStatus) {
                          return (
                            <View
                              className={`px-3 py-1 rounded-full border ${getPaymentStatusBadgeClass(paymentStatus)}`}
                            >
                              <Text className="text-xs font-medium">
                                {getPaymentStatusLabel(paymentStatus)}
                              </Text>
                            </View>
                          );
                        }
                      }
                      return null;
                    })()}
                    {uniqueStatuses.map((status) => (
                      <View
                        key={status}
                        className={`px-3 py-1 rounded-full ${getStatusBadgeClass(status)}`}
                      >
                        <Text className="text-xs font-medium">
                          {getStatusLabel(status)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Quick hint */}
                  <View className="flex-row items-center justify-end">
                    <Text className="text-primary text-sm font-medium mr-1">
                      View details
                    </Text>
                    <IconSymbol name="chevron.right" size={16} color="#3b82f6" />
                  </View>
                </Pressable>
              );
            })
          ) : (
            <EmptyState />
          )}
      </ScrollView>
    </View>
  );
}