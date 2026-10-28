import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShoppingBag } from 'lucide-react-native';
import {
  Action,
  Card,
  Message,
  PageScroll,
  palette,
  ui,
} from '@/components/ui/screen-kit';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AppImage } from '@/components/ui/app-image';
import { CartItemCard } from '@/components/cart/CartItemCard';
import { CartSummary } from '@/components/cart/CartSummary';
import {
  useHybridCart,
  useHybridUpdateCart,
  useHybridRemoveFromCart,
  useHybridClearCart,
} from '@/lib/hooks/use-hybrid-cart';
import { cartIssue, groupCart, pickupAddress } from '@/lib/cart-display';
import { formatMoney } from '@/lib/order-display';
import {
  formatTime12Hour,
  getEffectivePickupDay,
  getImageSource,
} from '@/lib/utils';
import type { CartItem } from '@/types';
export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const state = useHybridCart();
  const update = useHybridUpdateCart();
  const remove = useHybridRemoveFromCart();
  const clear = useHybridClearCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const lock = useRef(false);
  const [error, setError] = useState('');
  const [errorId, setErrorId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'cart' | 'saved' | null>(null);
  const busy = state.isUpdating || busyId !== null;
  const groups = groupCart(state.cart);
  const total =
    state.subtotal + state.serviceFee + state.tax + state.deliveryFee;
  const issues = state.cart.some((i) => !!cartIssue(i));
  async function change(
    item: CartItem,
    quantity?: number,
    choosePickup = false,
  ) {
    if (lock.current || busy) return;
    lock.current = true;
    setBusyId(item.id);
    setError('');
    setErrorId(null);
    try {
      if (quantity == null)
        await remove.mutateAsync(item.id, Number(item.productId));
      else
        await update.mutateAsync({
          item_id: item.id,
          product_id: Number(item.productId),
          quantity,
          fulfillment_method: choosePickup ? 'pickup' : undefined,
        });
    } catch (e) {
      const cause = e as { error?: string; message?: string };
      setErrorId(item.id);
      setError(
        cause.error ||
          cause.message ||
          'Unable to update this item. Please try again.',
      );
      void state.refetch();
    } finally {
      lock.current = false;
      setBusyId(null);
    }
  }
  async function empty() {
    if (lock.current || busy) return;
    lock.current = true;
    setBusyId('clear');
    setError('');
    setErrorId(null);
    try {
      if (confirm === 'saved') await state.discardSaved();
      else await clear.mutateAsync();
      setConfirm(null);
    } catch (e) {
      const cause = e as { error?: string; message?: string };
      setError(cause.error || cause.message || 'Unable to clear your cart.');
    } finally {
      lock.current = false;
      setBusyId(null);
    }
  }
  return (
    <View
      style={{ flex: 1, paddingTop: insets.top, backgroundColor: palette.bg }}
    >
      <View
        style={{
          minHeight: 60,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: palette.border,
        }}
      >
        <Text style={ui.title}>Cart</Text>
        {state.totalItems > 0 && (
          <Text style={ui.muted}>
            {state.totalItems} {state.totalItems === 1 ? 'item' : 'items'}
          </Text>
        )}
        <View style={{ flex: 1 }} />
        {state.cart.length > 0 && (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => {
              setError('');
              setConfirm('cart');
            }}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              opacity: busy ? 0.4 : 1,
            }}
          >
            <Text style={[ui.link, { color: palette.red }]}>Clear cart</Text>
          </Pressable>
        )}
      </View>
      <PageScroll
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={state.isFetching && !state.isLoading && !busy}
            onRefresh={() => void state.refetch()}
            tintColor={palette.green}
          />
        }
      >
        {state.isLoading ? <ActivityIndicator color={palette.green} /> : null}
        {state.isError && (
          <Message
            title="Unable to refresh your cart"
            body="Your items have not been cleared. Check your connection and try again."
            onRetry={() => void state.refetch()}
          />
        )}
        {(state.isSyncing || (state.savedItems > 0 && !state.syncError)) && (
          <Card>
            <View style={ui.row}>
              <ActivityIndicator color={palette.green} />
              <Text style={[ui.body, { flex: 1 }]}>
                Bringing your saved items into your account…
              </Text>
            </View>
          </Card>
        )}
        {!!state.syncError && (
          <Card>
            <Text style={ui.heading}>
              Some saved items still need attention
            </Text>
            <Text style={ui.muted}>{state.syncError}</Text>
            <Action
              secondary
              label="Retry saved cart"
              onPress={state.retrySync}
            />
            <Action
              secondary
              danger
              label="Remove remaining saved items"
              onPress={() => {
                setError('');
                setConfirm('saved');
              }}
            />
          </Card>
        )}
        {!!error && !errorId && (
          <Text
            accessibilityRole="alert"
            style={[ui.body, { color: palette.red }]}
          >
            {error}
          </Text>
        )}
        {!state.isLoading &&
          !state.isError &&
          !state.savedItems &&
          !state.cart.length && (
            <View
              style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}
            >
              <View
                style={{
                  padding: 20,
                  borderRadius: 40,
                  backgroundColor: '#eaf5ee',
                }}
              >
                <ShoppingBag size={32} color={palette.green} />
              </View>
              <Text style={ui.heading}>Your next meal starts here</Text>
              <Text style={[ui.muted, { textAlign: 'center' }]}>
                Explore meals and add something for pickup.
              </Text>
              <Action
                label="Explore meals"
                onPress={() => router.push('/(tabs)/explore')}
              />
            </View>
          )}
        {groups.map((group) => {
          const windows = [
            ...new Set(
              group.items
                .map((i) => {
                  const p = i.product;
                  return p.pickup_start_time && p.pickup_end_time
                    ? `${getEffectivePickupDay(p.pickup_day, p.pickup_end_time)} · ${formatTime12Hour(p.pickup_start_time)}–${formatTime12Hour(p.pickup_end_time)}`
                    : null;
                })
                .filter(Boolean),
            ),
          ];
          return (
            <Card key={group.id}>
              <View style={ui.row}>
                <AppImage
                  source={getImageSource(group.vendor?.logo)}
                  fallbackSource={require('@/assets/images/default-profile.jpg')}
                  style={{ width: 40, height: 40, borderRadius: 10 }}
                />
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={ui.heading}>
                    {group.vendor?.business_name || 'Pickup vendor'}
                  </Text>
                  <Text style={ui.muted}>
                    {pickupAddress(group.vendor) ||
                      'Pickup details confirmed at checkout'}
                  </Text>
                </View>
              </View>
              {windows.map((window) => (
                <Text key={window} style={[ui.muted, { color: palette.green }]}>
                  Pickup {window}
                </Text>
              ))}
              {group.items.map((item) => (
                <CartItemCard
                  key={item.id}
                  item={item}
                  error={errorId === item.id ? error : undefined}
                  busy={busyId === item.id}
                  disabled={busy}
                  onRemove={() => void change(item)}
                  onUpdateQuantity={(quantity) => void change(item, quantity)}
                  onChoosePickup={() => void change(item, item.quantity, true)}
                />
              ))}
            </Card>
          );
        })}
        {state.cart.length > 0 && (
          <CartSummary
            subtotal={state.subtotal}
            serviceFee={state.serviceFee}
            tax={state.tax}
            deliveryFee={state.deliveryFee}
            isAuthenticated={state.isAuthenticated}
          />
        )}
        {issues && (
          <Text style={[ui.muted, { color: '#92400e' }]}>
            Resolve the highlighted items before continuing to checkout.
          </Text>
        )}
      </PageScroll>
      {state.cart.length > 0 && (
        <View
          style={{
            padding: 16,
            gap: 10,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: palette.border,
          }}
        >
          <View style={ui.between}>
            <Text style={ui.muted}>Estimated total</Text>
            <Text style={ui.title}>{formatMoney(total)}</Text>
          </View>
          {(issues || state.savedItems > 0 || state.isError) && (
            <Text style={{ fontSize: 12, lineHeight: 18, color: '#92400e' }}>
              {issues
                ? 'Update the highlighted items to continue.'
                : state.savedItems > 0
                  ? 'Finish syncing your saved items to continue.'
                  : 'Refresh your cart to continue.'}
            </Text>
          )}
          <Action
            label={
              state.isAuthenticated
                ? 'Continue to checkout'
                : 'Sign in to checkout'
            }
            busy={busy}
            disabled={issues || state.isError || state.savedItems > 0}
            onPress={() => {
              if (busy || issues) return;
              if (!state.isAuthenticated)
                router.push({
                  pathname: '/login',
                  params: { returnTo: '/cart' },
                });
              else router.push('/checkout');
            }}
          />
        </View>
      )}
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        destructive
        busy={busy}
        title={confirm === 'saved' ? 'Remove saved items?' : 'Clear your cart?'}
        message={
          confirm === 'saved'
            ? 'Only the remaining saved guest items will be removed. Items already in your account will stay in your cart.'
            : 'All items in your cart will be removed.'
        }
        error={error}
        primaryLabel={confirm === 'saved' ? 'Remove saved items' : 'Clear cart'}
        onPrimary={() => void empty()}
        secondaryLabel="Keep items"
      />
    </View>
  );
}
