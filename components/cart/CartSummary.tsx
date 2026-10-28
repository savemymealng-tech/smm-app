import { Text } from 'react-native';
import { AmountRow, Card, ui } from '@/components/ui/screen-kit';
import { formatMoney } from '@/lib/order-display';
export function CartSummary({
  subtotal,
  serviceFee,
  tax,
  deliveryFee,
  isAuthenticated,
}: {
  subtotal: number;
  serviceFee: number;
  tax: number;
  deliveryFee: number;
  isAuthenticated: boolean;
}) {
  return (
    <Card>
      <Text style={ui.heading}>Price details</Text>
      <AmountRow label="Items subtotal" value={formatMoney(subtotal)} />
      {serviceFee > 0 && (
        <AmountRow label="Service fee" value={formatMoney(serviceFee)} />
      )}
      {tax > 0 && <AmountRow label="Tax" value={formatMoney(tax)} />}
      {deliveryFee > 0 && (
        <AmountRow
          label="Delivery fee on existing items"
          value={formatMoney(deliveryFee)}
        />
      )}
      <Text style={ui.muted}>
        {isAuthenticated
          ? 'Offers, SMM Coin and your final total are confirmed at checkout.'
          : 'Sign in to confirm fees, offers and your final total.'}
      </Text>
    </Card>
  );
}
