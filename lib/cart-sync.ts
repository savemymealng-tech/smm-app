import type { CartItem } from '@/types';
import type { Cart, AddToCartRequest, UpdateCartRequest } from '@/types/api';
type Journal = {
  sourceId: string;
  productId: number;
  sourceQuantity: number;
  target: number;
  complete: boolean;
}[];
type Options = {
  userId: string;
  items: CartItem[];
  api: {
    getCart: () => Promise<Cart>;
    addToCart: (data: AddToCartRequest) => Promise<Cart>;
    updateCart: (data: UpdateCartRequest) => Promise<Cart>;
  };
  storage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<unknown>;
  };
  isActive: () => boolean;
  onMerged: (id: string, quantity: number) => Promise<unknown>;
};
const running = new Map<string, Promise<void>>();
export function syncGuestCart(options: Options): Promise<void> {
  const previous = running.get(options.userId);
  if (previous) return previous;
  const job = run(options).finally(() => {
    if (running.get(options.userId) === job) running.delete(options.userId);
  });
  running.set(options.userId, job);
  return job;
}
async function run({
  userId,
  items,
  api,
  storage,
  isActive,
  onMerged,
}: Options) {
  const key = `smm-cart-import:${userId}`;
  const stored = await storage.getItem(key);
  let journal: Journal = stored ? JSON.parse(stored) : [];
  const save = () => storage.setItem(key, JSON.stringify(journal));
  for (const item of items) {
    if (!isActive()) return;
    if (
      item.fulfillment_method === 'delivery' ||
      item.product.available_for_pickup === false
    )
      throw new Error(
        'A saved item cannot be collected for pickup. Remove saved items or try again after availability changes.',
      );
    let entry = journal.find(
      (e) => e.sourceId === item.id && e.sourceQuantity === item.quantity,
    );
    if (!entry) {
      const current = await api.getCart();
      if (!isActive()) return;
      const existing = current.items.find(
        (i) => i.product_id === Number(item.productId),
      );
      entry = {
        sourceId: item.id,
        productId: Number(item.productId),
        sourceQuantity: item.quantity,
        target: (existing?.quantity || 0) + item.quantity,
        complete: false,
      };
      journal.push(entry);
      await save();
    }
    if (!entry.complete) {
      const current = await api.getCart();
      if (!isActive()) return;
      const existing = current.items.find(
        (i) => i.product_id === entry!.productId,
      );
      if (!existing)
        await api.addToCart({
          product_id: entry.productId,
          quantity: entry.target,
          fulfillment_method: 'pickup',
        });
      else if (
        existing.quantity < entry.target ||
        existing.fulfillment_method !== 'pickup'
      )
        await api.updateCart({
          product_id: entry.productId,
          quantity: Math.max(existing.quantity, entry.target),
          fulfillment_method: 'pickup',
        });
      entry.complete = true;
      await save();
    }
    if (!isActive()) return;
    await onMerged(item.id, item.quantity);
    journal = journal.filter((e) => e !== entry);
    await save();
  }
}
