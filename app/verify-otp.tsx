/**
 * OTP Verification Screen
 *
 * Reached via deep link:
 *   savemymeal://verify-otp?code=123456&email=user@example.com
 *   https://savemymeal.com/app/verify-otp?code=123456&email=user@example.com
 *   https://savemymeal.com/app/redirect?path=/verify-otp&params=code=123456&email=user@example.com
 */

import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { setAuthStateAtom } from "@/lib/atoms/auth";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [, setAuthState] = useAtom(setAuthStateAtom);

  // Params come from the deep link or redirect screen
  const { code: deepLinkCode, email: deepLinkEmail } = useLocalSearchParams<{
    code?: string;
    email?: string;
  }>();

  const [otp, setOtp] = useState(deepLinkCode || "");
  const [email, setEmail] = useState(deepLinkEmail || "");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const autoSubmittedRef = useRef(false);

  // Auto-verify if the code arrived via deep link
  useEffect(() => {
    if (
      deepLinkCode &&
      deepLinkCode.length === OTP_LENGTH &&
      deepLinkEmail &&
      !autoSubmittedRef.current
    ) {
      autoSubmittedRef.current = true;
      handleVerify(deepLinkCode, deepLinkEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkCode, deepLinkEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (codeOverride?: string, emailOverride?: string) => {
    const finalCode = codeOverride ?? otp;
    const finalEmail = emailOverride ?? email;

    if (!finalEmail.trim()) {
      toast.warning("Email Required", "Please enter your email address.");
      return;
    }
    if (finalCode.length !== OTP_LENGTH) {
      toast.warning("Invalid Code", `Please enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    setLoading(true);
    try {
      const result = await api.auth.verifyCode({ email: finalEmail.trim(), code: finalCode });

      // Fetch full profile
      let user = null;
      try {
        user = await api.profile.getProfile();
      } catch {
        user = {
          id: result.user?.id?.toString() || "",
          email: result.user?.email || finalEmail,
          name: "",
          phone: "",
          addresses: [],
          paymentMethods: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any;
      }

      await setAuthState({
        user,
        accessToken: result.token,
        refreshToken: result.refreshToken || "",
      });

      toast.success("Verified!", "Your account has been verified successfully.");
      router.replace("/(tabs)");
    } catch (err: any) {
      const msg =
        err.response?.data?.error ?? err.message ?? "Verification failed. Please try again.";
      toast.error("Verification Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.warning("Email Required", "Please enter your email address.");
      return;
    }
    setResending(true);
    try {
      await api.auth.requestCode(email.trim());
      setCountdown(60);
      toast.success("Code Sent", "A new verification code has been sent to your email.");
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? "Failed to resend code.";
      toast.error("Error", msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3 p-1">
          <IconSymbol name="arrow.left" size={24} color="#000" />
        </Pressable>
        <Text className="text-xl font-bold">Verify Account</Text>
      </View>

      <View className="flex-1 px-6 pt-6">
        {/* Icon */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4">
            <IconSymbol name="envelope.badge.fill" size={36} color="#1E8449" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">Check your email</Text>
          <Text className="text-gray-500 text-center mt-2 leading-5">
            We sent a {OTP_LENGTH}-digit code to{"\n"}
            <Text className="font-semibold text-gray-700">{email || "your email"}</Text>
          </Text>
        </View>

        {/* Email input (editable if not provided via deep link) */}
        {!deepLinkEmail && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#9ca3af"
              className="border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
            />
          </View>
        )}

        {/* OTP input */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Verification code
          </Text>
          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={(v) => setOtp(v.replace(/\D/g, "").slice(0, OTP_LENGTH))}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            placeholderTextColor="#9ca3af"
            className="border border-gray-200 rounded-xl px-4 py-4 text-2xl font-bold text-center tracking-[12px] text-gray-900 bg-gray-50"
            autoFocus={!deepLinkCode}
          />
        </View>

        {/* Verify button */}
        <Button
          onPress={() => handleVerify()}
          disabled={loading || otp.length !== OTP_LENGTH}
          className="w-full mb-4"
        >
          {loading ? (
            <View className="flex-row items-center justify-center gap-2">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-semibold">Verifying…</Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-base">Verify Account</Text>
          )}
        </Button>

        {/* Resend */}
        <View className="flex-row items-center justify-center">
          <Text className="text-gray-500">Didn't receive a code? </Text>
          {countdown > 0 ? (
            <Text className="text-gray-400 font-medium">Resend in {countdown}s</Text>
          ) : (
            <Pressable onPress={handleResend} disabled={resending}>
              {resending ? (
                <ActivityIndicator size="small" color="#1E8449" />
              ) : (
                <Text className="text-[#1E8449] font-semibold">Resend</Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
