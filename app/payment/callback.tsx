import { paymentVerificationStatus } from "@/lib/payment-status";
import { Screen, Card, Action, ui } from "@/components/ui/screen-kit";
import { api } from "@/lib/api";
import { useProtectedRoute } from "@/lib/hooks/use-protected-route";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

export default function PaymentCallback() {
  const { isAuthenticated, isLoading } = useProtectedRoute();
  const params = useLocalSearchParams<{
    reference?: string;
    trxref?: string;
  }>();
  const reference =
    typeof params.reference === "string"
      ? params.reference
      : typeof params.trxref === "string"
        ? params.trxref
        : "";
  const client = useQueryClient();
  const verification = useQuery({
    queryKey: ["payment-callback", reference],
    queryFn: () => api.payments.verifyPayment(reference),
    enabled: isAuthenticated && Boolean(reference),
    retry: false,
    staleTime: 30_000,
  });
  const status = paymentVerificationStatus(verification.data);
  useEffect(() => {
    if (status === "success") {
      for (const key of ["orders", "order", "cart", "rewards"])
        void client.invalidateQueries({ queryKey: [key] });
    }
  }, [status, client]);
  if (isLoading || !isAuthenticated) return null;
  const paid = status === "success";
  return (
    <Screen title="Payment status">
      <View style={{ padding: 16, gap: 16 }}>
        <Card>
          {verification.isLoading ? (
            <ActivityIndicator accessibilityLabel="Checking payment" />
          ) : (
            <>
              <Text style={ui.heading}>
                {paid
                  ? "Payment confirmed"
                  : !reference
                    ? "Incomplete payment link"
                    : "Check your order"}
              </Text>
              <Text style={ui.muted}>
                {paid
                  ? verification.data?.message ||
                    "Your payment has been confirmed. View your order for pickup details."
                  : !reference
                    ? "This link is missing a payment reference. You can check your payment from Orders."
                    : "Your payment has not been confirmed here. Review your order status before making another payment."}
              </Text>
              {reference && !paid && (
                <Action
                  label="Check again"
                  onPress={() => void verification.refetch()}
                  busy={verification.isFetching}
                />
              )}
              <Action
                label="View orders"
                onPress={() => router.replace("/orders")}
              />
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}
