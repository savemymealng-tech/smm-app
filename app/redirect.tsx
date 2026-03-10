/**
 * Deep Link Redirect Handler
 *
 * Handles incoming universal / app links from backend emails in the format:
 *   https://savemymeal.com/app/redirect?path=/verify-otp&params=code=123456&email=user@example.com
 *   https://savemymeal.com/app/redirect?path=/reset-password&params=token=abc123
 *   https://savemymeal.com/app/redirect?path=/order/123
 *
 * For direct deep links (order, product, vendor) Expo Router handles them
 * automatically via the linking config — this screen covers auth flows only.
 */

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RedirectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { path, params } = useLocalSearchParams<{ path?: string; params?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Parse the optional params string into a query-params object
    // Backend sends them as key=value pairs joined by & e.g. "code=123&email=a@b.com"
    const parsedParams: Record<string, string> = {};
    if (params) {
      params.split("&").forEach((pair) => {
        const [key, ...rest] = pair.split("=");
        if (key) parsedParams[key] = decodeURIComponent(rest.join("="));
      });
    }

    if (!path) {
      // No path provided — fall back to home
      router.replace("/(tabs)");
      return;
    }

    // Normalise: strip leading slash and lower-case for matching
    const normalised = path.replace(/^\//, "").toLowerCase();

    // ── Auth flows ──────────────────────────────────────────────────────────
    if (normalised === "verify-otp") {
      router.replace({
        pathname: "/verify-otp",
        params: parsedParams,
      });
      return;
    }

    if (normalised === "reset-password") {
      router.replace({
        pathname: "/reset-password",
        params: parsedParams,
      });
      return;
    }

    // ── Content routes ──────────────────────────────────────────────────────
    // These should already be handled by Expo Router's linking config, but
    // we support them here as a fallback when routed via ?path=

    const orderMatch = normalised.match(/^orders?\/(\d+)$/);
    if (orderMatch) {
      router.replace(`/order/${orderMatch[1]}` as any);
      return;
    }

    const productMatch = normalised.match(/^products?\/(\d+)$/);
    if (productMatch) {
      router.replace(`/product/${productMatch[1]}` as any);
      return;
    }

    const vendorMatch = normalised.match(/^vendors?\/(\d+)$/);
    if (vendorMatch) {
      router.replace(`/vendor/${vendorMatch[1]}` as any);
      return;
    }

    if (normalised === "orders") {
      router.replace("/orders");
      return;
    }

    // Unknown path — go home
    router.replace("/(tabs)");
  }, [path, params, router]);

  return (
    <View
      className="flex-1 bg-white items-center justify-center"
      style={{ paddingTop: insets.top }}
    >
      <IconSymbol name="link" size={40} color="#1E8449" />
      <ActivityIndicator size="large" color="#1E8449" className="mt-6" />
      <Text className="text-gray-500 mt-4 text-base">Opening…</Text>
    </View>
  );
}
