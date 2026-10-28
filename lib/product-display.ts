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
