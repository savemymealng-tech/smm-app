export function ratingLabel(value: unknown): string {
  const rating =
    typeof value === 'number' || typeof value === 'string'
      ? Number(value)
      : NaN;
  return Number.isFinite(rating) && rating > 0 && rating <= 5
    ? rating.toFixed(1)
    : 'No reviews yet';
}
export function remainingStock(stock: number, inCart: number): number {
  return Math.max(
    0,
    Math.floor(Number(stock) || 0) - Math.max(0, Number(inCart) || 0),
  );
}

export function productDiscount(price: unknown, originalPrice: unknown) {
  const current =
    typeof price === 'number' ||
    (typeof price === 'string' && price.trim() !== '')
      ? Number(price)
      : NaN;
  const original =
    typeof originalPrice === 'number' ||
    (typeof originalPrice === 'string' && originalPrice.trim() !== '')
      ? Number(originalPrice)
      : NaN;
  if (
    !Number.isFinite(current) ||
    !Number.isFinite(original) ||
    current < 0 ||
    original <= current ||
    original <= 0
  )
    return { hasDiscount: false, percent: 0, label: '' };
  const percent = Math.round(((original - current) / original) * 100);
  return {
    hasDiscount: true,
    percent,
    label: percent < 1 ? '<1% off' : `${percent}% off`,
  };
}

/** Pickup-only storefront: delivery support never disables an available pickup option. */
export function pickupUnavailableReason(
  product: {
    is_available?: boolean;
    available_for_pickup?: boolean;
    available_for_delivery?: boolean;
    quantity_available: number;
    expiry_date?: string | null;
  },
  now = Date.now(),
): string | null {
  if (product.is_available === false) return 'Currently unavailable';
  if (!(Number(product.quantity_available) > 0)) return 'Out of stock';
  const expiry = product.expiry_date
    ? new Date(product.expiry_date).getTime()
    : NaN;
  if (Number.isFinite(expiry) && expiry <= now)
    return 'This product has expired';
  if (product.available_for_pickup === false)
    return product.available_for_delivery
      ? 'Not available for pickup'
      : 'Currently unavailable';
  return null;
}
