import {
  formatMoney as formatCurrency,
  orderPayable,
  canPay,
  isPaid,
  statusLabel,
  paymentLabel,
  receipt,
} from '@/lib/order-display';
import { Text, View, Linking } from 'react-native';
import type { Order, OrderItem } from '@/types/api';
import {
  Card,
  Action,
  Badge,
  AmountRow,
  ui,
  palette,
} from '@/components/ui/screen-kit';
import { AppImage } from '@/components/ui/app-image';
import { formatTime12Hour, getImageSource } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
export function PickupDetails({
  orders,
  onCancel,
  onPay,
  onReview,
  paying,
  cancelling,
}: {
  orders: Order[];
  onCancel: (order: Order) => void;
  onPay: (order?: Order) => void;
  onReview: (item: OrderItem, order: Order) => void;
  paying: boolean;
  cancelling: boolean;
}) {
  const totals = receipt(orders);
  const payable = orders.filter(canPay);
  const sharedPayment =
    orders.length > 1 &&
    payable.length === orders.length &&
    new Set(orders.map((o) => o.payment?.order_group_id || o.order_group_id))
      .size === 1;
  async function open(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      toast.error('Unable to open', 'Please try again or contact support.');
    }
  }
  return (
    <>
      <Card>
        <Text style={ui.heading}>
          {orders.length > 1
            ? `${orders.length} vendor pickups`
            : `Order #${orders[0].id}`}
        </Text>
        <Text style={ui.muted}>
          {new Date(orders[0].createdAt).toLocaleString()}
        </Text>
        <Text style={ui.body}>
          Follow each vendor’s status and collect your meals when they are
          ready.
        </Text>
        {orders.every(isPaid) && <Badge label="Payment confirmed" />}
      </Card>
      {orders.map((order) => {
        const address = [
          order.vendor?.address,
          order.vendor?.city,
          order.vendor?.state?.name,
        ]
          .filter(Boolean)
          .join(', ');
        const items = order.orderItems || order.items || [];
        const cancellable =
          order.status === 'pending' &&
          (!order.checkout_id || !isPaid(order)) &&
          (!order.checkout_id ||
            orders.every((o) => o.status === 'pending' && !isPaid(o)));
        return (
          <Card key={order.id}>
            <View style={ui.row}>
              <AppImage
                source={getImageSource(order.vendor?.logo)}
                fallbackSource={require('@/assets/images/default-profile.jpg')}
                style={{ width: 44, height: 44, borderRadius: 12 }}
              />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={ui.heading}>
                  {order.vendor?.business_name || 'Pickup vendor'}
                </Text>
                <Text style={ui.muted}>Order #{order.id}</Text>
              </View>
            </View>
            <View style={[ui.row, { flexWrap: 'wrap' }]}>
              <Badge label={statusLabel(order.status)} />
              <Badge neutral={!isPaid(order)} label={paymentLabel(order)} />
            </View>
            {order.status === 'pending' && (
              <Text style={ui.muted}>
                {isPaid(order)
                  ? 'Waiting for the vendor to confirm your pickup.'
                  : 'Complete payment to continue your pickup order.'}
              </Text>
            )}
            {order.status === 'accepted' && (
              <Text style={ui.muted}>
                The vendor confirmed your order. Watch for a ready-for-pickup
                update.
              </Text>
            )}
            {order.status === 'preparing' && (
              <Text style={ui.muted}>The vendor is preparing your meal.</Text>
            )}
            {order.status === 'ready' && (
              <Text style={[ui.body, { color: palette.green }]}>
                Your meal is ready. Show this order when you collect it.
              </Text>
            )}
            {order.rejection_reason && (
              <Text style={ui.muted}>{order.rejection_reason}</Text>
            )}
            <View style={ui.line} />
            <Text style={ui.heading}>Pickup location</Text>
            <Text style={ui.muted}>
              {address || 'Contact the vendor for collection details.'}
            </Text>
            <View style={ui.row}>
              {!!address && (
                <View style={{ flex: 1 }}>
                  <Action
                    secondary
                    label="Directions"
                    onPress={() =>
                      void open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                      )
                    }
                  />
                </View>
              )}
              {!!order.vendor?.phone && (
                <View style={{ flex: 1 }}>
                  <Action
                    secondary
                    label="Call vendor"
                    onPress={() =>
                      void open(
                        `tel:${order.vendor!.phone!.replace(/[^+0-9]/g, '')}`,
                      )
                    }
                  />
                </View>
              )}
            </View>
            <View style={ui.line} />
            {items.map((item) => (
              <View key={item.id} style={{ gap: 8 }}>
                <View style={ui.row}>
                  <AppImage
                    source={getImageSource(item.product?.photo_url)}
                    style={{ width: 48, height: 48, borderRadius: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={ui.body}>{item.product?.name || 'Meal'}</Text>
                    <Text style={ui.muted}>
                      {item.quantity} × {formatCurrency(Number(item.price))}
                    </Text>
                  </View>
                  <Text style={ui.body}>
                    {formatCurrency(Number(item.price) * item.quantity)}
                  </Text>
                </View>
                {item.product?.pickup_start_time &&
                  item.product?.pickup_end_time && (
                    <Text style={ui.muted}>
                      Collection window ·{' '}
                      {formatTime12Hour(item.product.pickup_start_time)}–
                      {formatTime12Hour(item.product.pickup_end_time)}
                    </Text>
                  )}
                {isPaid(order) &&
                  ['completed', 'delivered'].includes(order.status) &&
                  (item.has_review ? (
                    <Text style={ui.muted}>Review submitted</Text>
                  ) : (
                    <Action
                      secondary
                      label="Review this meal"
                      onPress={() => onReview(item, order)}
                    />
                  ))}
              </View>
            ))}
            {order.special_instructions && (
              <Text style={ui.muted}>
                Order note: {order.special_instructions}
              </Text>
            )}
            <AmountRow
              label="Vendor order total"
              value={formatCurrency(orderPayable(order))}
            />
            {canPay(order) && !sharedPayment && (
              <Action
                label={
                  order.payment?.reference
                    ? 'Check / complete payment'
                    : 'Complete payment'
                }
                busy={paying}
                onPress={() => onPay(order)}
              />
            )}{' '}
            {cancellable && (
              <Action
                secondary
                danger
                label={
                  order.checkout_id && orders.length > 1
                    ? 'Cancel unpaid checkout'
                    : 'Cancel order'
                }
                disabled={cancelling}
                onPress={() => onCancel(order)}
              />
            )}
          </Card>
        );
      })}
      <Card>
        <Text style={ui.heading}>Receipt</Text>
        <AmountRow
          label="Items subtotal"
          value={formatCurrency(totals.subtotal)}
        />
        <AmountRow label="Service fee" value={formatCurrency(totals.service)} />
        {totals.delivery > 0 && (
          <AmountRow
            label="Delivery fee (original order)"
            value={formatCurrency(totals.delivery)}
          />
        )}{' '}
        {totals.discount > 0 && (
          <AmountRow
            label="Offer savings"
            value={`−${formatCurrency(totals.discount)}`}
          />
        )}{' '}
        {totals.coins > 0 && (
          <AmountRow
            label="SMM Coin"
            value={`−${formatCurrency(totals.coins)}`}
          />
        )}
        <View style={ui.line} />
        <AmountRow
          total
          label="Order total"
          value={formatCurrency(totals.total)}
        />
        {sharedPayment && (
          <Action
            label={
              orders[0].payment?.reference
                ? 'Check / complete payment'
                : `Pay ${formatCurrency(totals.total)}`
            }
            busy={paying}
            onPress={() => onPay()}
          />
        )}
        <Text style={ui.muted}>
          If a payment is pending, check its status before paying again.
        </Text>
      </Card>
    </>
  );
}
