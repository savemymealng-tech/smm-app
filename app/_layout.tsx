import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Provider as JotaiProvider } from "jotai";
import { useEffect } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

import { ToastProvider } from "@/components/ui/toast";
import { initAuthAtom, initCartAtom } from "@/lib/atoms";
import { useTokenRefresh } from "@/lib/hooks";
import { PortalHost } from "@rn-primitives/portal";
import { useSetAtom } from "jotai";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
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
              <Stack.Screen name="checkout" options={{ headerShown: false }} />
              <Stack.Screen name="addresses" options={{ headerShown: false }} />
              <Stack.Screen name="payments" options={{ headerShown: false }} />
              <Stack.Screen name="orders" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen name="vendor/[id]" options={{ headerShown: false }} />
              <Stack.Screen
                name="product/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="category/[id]"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="add-address" options={{ headerShown: false }} />
              <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
              <Stack.Screen name="my-reviews" options={{ headerShown: false }} />
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

function InitAtoms() {
  const initAuth = useSetAtom(initAuthAtom);
  const initCart = useSetAtom(initCartAtom);
  
  // Initialize automatic token refresh
  useTokenRefresh();

  useEffect(() => {
    async function prepare() {
      try {
        await initAuth();
        await initCart();
      } catch (e) {
        console.warn('Error initializing app:', e);
      } finally {
        // Hide the splash screen after initialization
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [initAuth, initCart]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <JotaiProvider>
        <InitAtoms />
        <AppProviders />
      </JotaiProvider>
    </QueryClientProvider>
  );
}
