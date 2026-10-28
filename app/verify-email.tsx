import { Screen, Card, Action, ui } from "@/components/ui/screen-kit";
import apiClient from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

export default function VerifyEmail() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const verification = useQuery({
    queryKey: ["email-verification", token],
    retry: false,
    staleTime: Infinity,
    enabled: typeof token === "string" && Boolean(token),
    queryFn: async () => {
      const response = await apiClient.get("/auth/verify-email", {
        params: { token },
      });
      if (!response.data.success)
        throw new Error(response.data.error || "Unable to verify email");
      return response.data.data;
    },
  });
  return (
    <Screen title="Verify email">
      <View style={{ padding: 16 }}>
        <Card>
          {verification.isLoading ? (
            <ActivityIndicator accessibilityLabel="Verifying email" />
          ) : (
            <>
              <Text style={ui.heading}>
                {verification.isSuccess
                  ? "Email verified"
                  : "Unable to verify this link"}
              </Text>
              <Text style={ui.muted}>
                {verification.isSuccess
                  ? "Your email is verified. You can now sign in."
                  : "The link may be incomplete or expired. Sign in to request a new verification code."}
              </Text>
              <Action
                label="Sign in"
                onPress={() => router.replace("/login")}
              />
            </>
          )}
        </Card>
      </View>
    </Screen>
  );
}
