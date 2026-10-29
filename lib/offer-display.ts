import type { Offer } from '@/lib/api/discovery';
export function offerDisplay(offer: Offer) {
  const value = Number(offer.value);
  const saving =
    Number.isFinite(value) && value > 0
      ? offer.benefit === 'percentage'
        ? `${value}% off`
        : `₦${value.toLocaleString('en-NG', { maximumFractionDigits: 2 })} off`
      : 'Special offer';
  const audience =
    offer.audience === 'first'
      ? 'First order'
      : offer.audience === 'returning'
        ? 'Returning customers'
        : offer.audience === 'nth'
          ? 'Selected orders'
          : 'Limited-time offer';
  const minimum = Number(offer.minimum_spend_kobo);
  const detail =
    Number.isFinite(minimum) && minimum > 0
      ? `Min. order ₦${(minimum / 100).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
      : 'Eligibility checked at checkout';
  return { saving, audience, detail };
}
