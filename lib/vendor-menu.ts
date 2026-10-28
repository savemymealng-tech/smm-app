import type { Meal } from "@/types/api";

export type VendorMenuCategory = { key: string; label: string; count: number };

export function buildVendorMenu(input: Meal[] | undefined) {
  const products = Array.from(
    new Map(
      (Array.isArray(input) ? input : [])
        .filter((product) => product && product.id != null)
        .map((product) => [product.id, product]),
    ).values(),
  );
  const groups = new Map<string, { label: string; products: Meal[] }>();
  for (const product of products) {
    const memberships = new Map<string, string>();
    for (const category of product.categories || []) {
      if (category?.name?.trim())
        memberships.set(`category:${category.id}`, category.name.trim());
    }
    if (!memberships.size) memberships.set("uncategorized", "Other");
    for (const [key, label] of memberships) {
      if (!groups.has(key)) groups.set(key, { label, products: [] });
      groups.get(key)!.products.push(product);
    }
  }
  const categories: VendorMenuCategory[] = Array.from(
    groups,
    ([key, group]) => ({
      key,
      label: group.label,
      count: group.products.length,
    }),
  ).sort((a, b) =>
    a.key === "uncategorized"
      ? 1
      : b.key === "uncategorized"
        ? -1
        : a.label.localeCompare(b.label),
  );
  return {
    products,
    categories,
    productsByCategory: new Map(
      Array.from(groups, ([key, group]) => [key, group.products]),
    ),
  };
}
