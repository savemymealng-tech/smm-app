import api from "./client";
import type { Meal } from "@/types/api";
export type Offer = {
  id: number;
  kind: "campaign" | "deal";
  title: string;
  description: string;
  image_url: string;
  terms: string;
  destination: string;
  ends_at: string;
  benefit: string;
  value: number;
  audience?: string;
  requires_sign_in?: boolean;
  code?: string | null;
  minimum_spend_kobo?: number;
  maximum_discount_kobo?: number;
};
export type ProductPage = {
  data: Meal[];
  total: number;
  page: number;
  totalPages: number;
};
export type Area = {
  city?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
};
export const discoveryApi = {
  home: async (params: Area) =>
    (
      await api.get<{ data: { offers: Offer[]; packs: Meal[] } }>(
        "/discovery",
        { params },
      )
    ).data.data,
  collection: async (
    kind: "campaign" | "deal",
    id: string,
    params: Area & { page: number },
  ) =>
    (
      await api.get<{ data: { offer: Offer; products: ProductPage } }>(
        `/discovery/${kind === "deal" ? "deals" : "campaigns"}/${id}`,
        { params: { ...params, limit: 20 } },
      )
    ).data.data,
  packs: async (params: Area & { page: number }) =>
    (
      await api.get<{ data: ProductPage }>("/discovery/packs", {
        params: { ...params, limit: 20 },
      })
    ).data.data,
};
