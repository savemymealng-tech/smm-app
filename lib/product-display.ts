export function ratingLabel(value: unknown): string {
  const rating =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : NaN;
  return Number.isFinite(rating) && rating > 0 && rating <= 5
    ? rating.toFixed(1)
    : "No reviews yet";
}
export function remainingStock(stock: number, inCart: number): number {
  return Math.max(
    0,
    Math.floor(Number(stock) || 0) - Math.max(0, Number(inCart) || 0),
  );
}
