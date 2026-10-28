import type { CartItem } from '@/types';
import type { Cart } from '@/types/api';
export function stockAvailable(product: CartItem['product']): number | null {
  const p = product as typeof product & {
    quantity_available?: number;
    quantityAvailable?: number;
  };
  const value = p.quantity_available ?? p.quantityAvailable ?? p.stockCount;
  return value == null ? null : Math.max(0, Math.floor(Number(value) || 0));
}
export function cartIssue(item: CartItem): string | null {
  const p = item.product as typeof item.product & {
    is_available?: boolean;
    expiry_date?: string;
  };
  if (p.is_available === false || p.isAvailable === false)
    return 'This meal is no longer available.';
  if (
    p.available_for_pickup === false ||
    item.fulfillment_method === 'delivery'
  )
    return 'This item is not available for pickup. Remove it to continue.';
  if (p.expiry_date) {
    const date = new Date(p.expiry_date);
    if (Number.isFinite(date.getTime()) && date.getTime() < Date.now())
      return 'This meal has expired. Remove it to continue.';
  }
  const stock = stockAvailable(p);
  if (stock === 0) return 'Sold out. Remove this item to continue.';
  if (stock !== null && item.quantity > stock)
    return `Only ${stock} available. Reduce the quantity to continue.`;
  if (item.requires_fulfillment_choice) return 'Choose pickup to continue.';
  return null;
}
export function displayItems(cart: Cart | undefined): CartItem[] {
  return (cart?.items || []).map((item) => {
    const product = item.product;
    const price =
      Number(item.price_snapshot ?? item.price ?? product.price) || 0;
    return {
      id: String(item.id ?? item.product_id),
      productId: String(item.product_id),
      vendorId: String(product.vendor_id ?? product.vendor?.id ?? ''),
      product: product as unknown as CartItem['product'],
      quantity: item.quantity,
      unitPrice: price,
      totalPrice: price * item.quantity,
      customizations: {},
      fulfillment_method: item.fulfillment_method ?? null,
      requires_fulfillment_choice: item.requires_fulfillment_choice ?? false,
    };
  });
}
export function groupCart(items: CartItem[]) {
  const groups = new Map<
    string,
    { id: string; vendor: CartItem['product']['vendor']; items: CartItem[] }
  >();
  for (const item of items) {
    const id = String(
      item.vendorId || item.product.vendor?.id || `product-${item.productId}`,
    );
    if (!groups.has(id))
      groups.set(id, { id, vendor: item.product.vendor, items: [] });
    groups.get(id)!.items.push(item);
  }
  return [...groups.values()];
}

export function pickupAddress(vendor?: { address?: string; city?: string }) {
  const address = vendor?.address?.trim() || '',
    city = vendor?.city?.trim() || '';
  if (!address) return city;
  return city && !address.toLocaleLowerCase().includes(city.toLocaleLowerCase())
    ? `${address}, ${city}`
    : address;
}
