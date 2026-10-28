import { useGuestCartSync } from "@/lib/hooks/use-guest-cart-sync";
import { isRateLimited } from "@/lib/api/rate-limit";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Provider as JotaiProvider, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { initializeApp } from "@/lib/startup";
import { StartupScreen } from "@/components/ui/startup-screen";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { ToastProvider } from "@/components/ui/toast";
import { initAuthAtom, initCartAtom } from "@/lib/atoms";
import { useTokenRefresh } from "@/lib/hooks";
import { PortalHost } from "@rn-primitives/portal";

// Keep the native launch screen until the first React layout is ready.
void SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: "(tabs)",
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error) => !isRateLimited(error) && failureCount < 1,
    },
  },
});

function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ToastProvider>
          <ThemeProvider value={DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="signup" options={{ headerShown: false }} />
              <Stack.Screen
                name="forgot-password"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="checkout" options={{ headerShown: false }} />
              <Stack.Screen name="addresses" options={{ headerShown: false }} />
              <Stack.Screen name="payments" options={{ headerShown: false }} />
              <Stack.Screen name="orders" options={{ headerShown: false }} />
              <Stack.Screen name="vendors" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen name="rewards" options={{ headerShown: false }} />
              <Stack.Screen name="packs" options={{ headerShown: false }} />
              <Stack.Screen name="pack/[id]" options={{ headerShown: false }} />
              <Stack.Screen
                name="campaign/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="deal/[id]" options={{ headerShown: false }} />
              <Stack.Screen
                name="payment/callback"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="verify-email"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="vendor/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="product/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="category/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="order/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="order/[id]/review"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="add-address"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="edit-profile"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="my-reviews"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="redirect" options={{ headerShown: false }} />
              <Stack.Screen
                name="verify-otp"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="reset-password"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack>
            <StatusBar style="dark" backgroundColor="#ffffff" />
            <PortalHost />
          </ThemeProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

function InitAtoms({ onReady }: { onReady: () => void }) {
  const initAuth = useSetAtom(initAuthAtom);
  const initCart = useSetAtom(initCartAtom);

  // Initialize automatic token refresh
  useTokenRefresh();
  useGuestCartSync();

  useEffect(() => {
    return initializeApp({
      restoreAuth: initAuth,
      restoreCart: initCart,
      onReady,
      onError: (error) => console.warn("App initialization failed", error),
    });
  }, [initAuth, initCart, onReady]);

  return null;
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <View
          style={{ flex: 1 }}
          onLayout={() => {
            void SplashScreen.hideAsync().catch(() => {});
          }}
        >
          <InitAtoms onReady={onReady} />
          <AppProviders />
          {!ready && <StartupScreen />}
        </View>
      </JotaiProvider>
    </QueryClientProvider>
  );
}
