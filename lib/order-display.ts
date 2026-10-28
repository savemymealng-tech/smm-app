import type { Order } from '@/types/api';
export const activeStatuses = ['pending', 'accepted', 'preparing', 'ready'];
export function isPaid(order: Order) {
  if (
    order.payment_status === 'refunded' ||
    order.payment?.status === 'refunded'
  )
    return false;
  return order.payment_status === 'paid' || order.payment?.status === 'success';
}
export function orderPayable(order: Order) {
  return order.pricing_snapshot?.payable_kobo != null
    ? Number(order.pricing_snapshot.payable_kobo) / 100
    : Math.max(
        0,
        Math.round(Number(order.total_amount || 0) * 100) -
          Number(order.coin_kobo || 0),
      ) / 100;
}
export function canPay(order: Order) {
  return (
    activeStatuses.includes(order.status) &&
    !isPaid(order) &&
    !['refunded', 'cancelled'].includes(order.payment_status || '') &&
    order.payment?.status !== 'refunded' &&
    orderPayable(order) > 0
  );
}
export function statusLabel(status: string) {
  return (
    (
      {
        pending: 'Awaiting confirmation',
        accepted: 'Confirmed',
        preparing: 'Preparing',
        ready: 'Ready for pickup',
        delivered: 'Picked up',
        completed: 'Picked up',
        cancelled: 'Cancelled',
        rejected: 'Declined',
      } as Record<string, string>
    )[status] || status
  );
}
export function paymentLabel(order: Order) {
  if (
    order.payment_status === 'refunded' ||
    order.payment?.status === 'refunded'
  )
    return 'Refunded';
  if (isPaid(order))
    return order.payment_method === 'smm_coin'
      ? 'Paid with SMM Coin'
      : order.payment_method === 'promotion'
        ? 'Covered by offer'
        : 'Paid';
  if (order.payment_status === 'cancelled') return 'Payment cancelled';
  return order.payment_status === 'failed' || order.payment?.status === 'failed'
    ? 'Payment unsuccessful'
    : 'Payment pending';
}
export function receipt(orders: Order[]) {
  return orders.reduce(
    (a, o) => {
      const items = o.orderItems || o.items || [];
      a.subtotal +=
        o.subtotal_kobo != null
          ? Number(o.subtotal_kobo) / 100
          : items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);
      a.service += Number(o.service_fee || 0);
      a.delivery += Number(o.delivery_fee || 0);
      a.discount += Number(o.discount_kobo || 0) / 100;
      a.coins += Number(o.coin_kobo || 0) / 100;
      a.total += orderPayable(o);
      return a;
    },
    { subtotal: 0, service: 0, delivery: 0, discount: 0, coins: 0, total: 0 },
  );
}

/** Preserve fractional naira in receipts and payment actions. */
export function formatMoney(amount: number) {
  if (!Number.isFinite(amount)) return '—';
  const kobo = Math.round(amount * 100);
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: kobo % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(kobo / 100);
}
