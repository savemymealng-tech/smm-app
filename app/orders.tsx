import {
  formatMoney as formatCurrency,
  paymentLabel,
  isPaid,
  statusLabel,
  orderPayable,
} from '@/lib/order-display';
import { useState } from 'react';
import {
  Text,
  View,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Screen,
  Card,
  Action,
  Message,
  Badge,
  ui,
  palette,
} from '@/components/ui/screen-kit';
import { AppImage } from '@/components/ui/app-image';
import { api } from '@/lib/api';
import { useProtectedRoute } from '@/lib/hooks/use-protected-route';
import { getImageSource } from '@/lib/utils';
export default function OrdersScreen() {
  const { isAuthenticated, isLoading: authLoading } = useProtectedRoute();
  const [tab, setTab] = useState<'all' | 'progress' | 'past'>('all');
  const history = useInfiniteQuery({
    queryKey: ['orders', 'history', tab],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.orders.historyPage(tab, pageParam),
    getNextPageParam: (p) => (p.page < p.totalPages ? p.page + 1 : undefined),
    enabled: isAuthenticated,
  });
  const counts = history.data?.pages[0].counts;
  const rows = [
    ...new Map(
      (history.data?.pages.flatMap((p) => p.data) || []).map((item) => [
        'orders' in item ? `group:${item.order_group_id}` : `single:${item.id}`,
        item,
      ]),
    ).values(),
  ];
  if (authLoading || !isAuthenticated) return null;
  return (
    <Screen title="Orders">
      <View
        style={{
          flexDirection: 'row',
          padding: 12,
          gap: 6,
          backgroundColor: '#fff',
        }}
      >
        {(['all', 'progress', 'past'] as const).map((t) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            key={t}
            onPress={() => setTab(t)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              backgroundColor: tab === t ? '#eaf7ee' : '#f5f7f6',
            }}
          >
            <Text style={tab === t ? ui.link : ui.muted}>
              {t === 'progress' ? 'In progress' : t === 'past' ? 'Past' : 'All'}
              {counts ? ` (${counts[t]})` : ''}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) =>
          'orders' in item
            ? `group:${item.order_group_id}`
            : `single:${item.id}`
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          gap: 14,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            tintColor={palette.green}
            refreshing={history.isRefetching && !history.isFetchingNextPage}
            onRefresh={() => void history.refetch()}
          />
        }
        ListEmptyComponent={
          history.isLoading ? (
            <ActivityIndicator color={palette.green} />
          ) : history.isError ? (
            <Message
              title="Unable to load orders"
              body={history.error.message}
              onRetry={() => void history.refetch()}
            />
          ) : (
            <Message
              title={
                tab === 'progress'
                  ? 'No orders in progress'
                  : 'No orders here yet'
              }
              body="Your meals and pickup updates will appear here."
            />
          )
        }
        renderItem={({ item }) => {
          const orders = 'orders' in item ? item.orders : [item];
          const first = orders[0];
          const grouped = 'orders' in item;
          const total = orders.reduce((sum, o) => sum + orderPayable(o), 0);
          const statuses = [...new Set(orders.map((o) => o.status))];
          const allPaid = orders.every(isPaid);
          const items = orders.flatMap((o) => o.orderItems || o.items || []);
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View order ${first.id}`}
              onPress={() =>
                router.push(
                  `/order/${grouped ? encodeURIComponent(item.order_group_id) : first.id}` as any,
                )
              }
            >
              <Card>
                <View style={ui.row}>
                  <AppImage
                    source={getImageSource(first.vendor?.logo)}
                    fallbackSource={require('@/assets/images/default-profile.jpg')}
                    style={{ width: 48, height: 48, borderRadius: 12 }}
                  />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={ui.heading}>
                      {grouped
                        ? `${orders.length} vendors`
                        : first.vendor?.business_name || 'Your order'}
                    </Text>
                    <Text style={ui.muted}>
                      {new Date(
                        grouped ? item.created_at : first.createdAt,
                      ).toLocaleDateString()}{' '}
                      · {items.reduce((s, i) => s + i.quantity, 0)} items
                    </Text>
                  </View>
                  <Text style={ui.heading}>{formatCurrency(total)}</Text>
                </View>
                <View style={[ui.row, { flexWrap: 'wrap' }]}>
                  <Badge
                    label={
                      statuses.length === 1
                        ? statusLabel(statuses[0])
                        : 'Multiple pickup statuses'
                    }
                  />
                  <Badge
                    neutral={!allPaid}
                    label={
                      allPaid
                        ? 'Paid'
                        : orders.every(
                              (o) => paymentLabel(o) === paymentLabel(first),
                            )
                          ? paymentLabel(first)
                          : 'View payment status'
                    }
                  />
                </View>
                {grouped &&
                  orders.map((o) => (
                    <View key={o.id} style={ui.between}>
                      <Text numberOfLines={1} style={[ui.muted, { flex: 1 }]}>
                        {o.vendor?.business_name || 'Vendor'}
                      </Text>
                      <Text style={ui.muted}>{statusLabel(o.status)}</Text>
                    </View>
                  ))}
                <Text style={ui.link}>View order details →</Text>
              </Card>
            </Pressable>
          );
        }}
        ListFooterComponent={
          history.isError && rows.length ? (
            <Message
              title="Could not load more orders"
              onRetry={() => void history.fetchNextPage()}
            />
          ) : history.hasNextPage ? (
            <Action
              secondary
              busy={history.isFetchingNextPage}
              label="Load more orders"
              onPress={() => void history.fetchNextPage()}
            />
          ) : null
        }
      />
    </Screen>
  );
}
