import { authAtom } from "@/lib/atoms";
import { usePathname, useLocalSearchParams, useRouter } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect } from "react";

/**
 * Redirects unauthenticated users to the login screen.
 * Returns { isAuthenticated, isLoading } so the caller can render null
 * while the redirect is in flight (avoids a content flash).
 *
 * Usage:
 *   const { isAuthenticated, isLoading } = useProtectedRoute();
 *   if (isLoading || !isAuthenticated) return null;
 */
export function useProtectedRoute() {
  const { isAuthenticated, isLoading } = useAtomValue(authAtom);
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams<{
    reference?: string;
    trxref?: string;
  }>();
  const reference = params.reference || params.trxref;
  const returnTo =
    pathname === "/payment/callback" && typeof reference === "string"
      ? pathname + "?reference=" + encodeURIComponent(reference)
      : pathname;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace({ pathname: "/login", params: { returnTo } });
    }
  }, [isAuthenticated, isLoading, returnTo, router]);

  return { isAuthenticated, isLoading };
}
