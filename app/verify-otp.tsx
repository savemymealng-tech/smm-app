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
import { setAuthStateAtom, verificationContextAtom } from "@/lib/atoms/auth";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OTP_LENGTH = 6;

export default function VerifyOTPScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [, setAuthState] = useAtom(setAuthStateAtom);
  const [verificationContext, setVerificationContext] = useAtom(verificationContextAtom);

  console.log('📧 [VerifyOTP] Verification context:', verificationContext);
  
  // Use only context, don't try to parse URL params at all
  // This avoids the path.split error entirely
  const initialEmail = verificationContext?.email || "";
  const isFromSignup = verificationContext?.fromSignup || false;

  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<TextInput>(null);
  
  console.log('📧 [VerifyOTP] Initial email:', initialEmail, 'isFromSignup:', isFromSignup);
  
  // Clear verification context after we've read it
  useEffect(() => {
    if (verificationContext?.email) {
      console.log('📧 [VerifyOTP] Clearing verification context');
      setVerificationContext({ email: null, fromSignup: false });
    }
  }, [verificationContext?.email]);

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
      // Use verifyEmailCode - does NOT auto-login
      const result = await api.auth.verifyEmailCode({ 
        email: finalEmail.trim(), 
        code: finalCode 
      });

      toast.success("Email Verified!", "Your email has been verified. You can now log in.");
      
      // Redirect to login screen
      router.replace('/login');
      
    } catch (err: any) {
      const msg =
        err.response?.data?.error ?? 
        err.response?.data?.message ??
        err.error ??
        err.message ?? 
        "Verification failed. The code may be invalid or expired.";
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
      await api.auth.resendVerificationCode(email.trim());
      setCountdown(60);
      toast.success("Code Sent", "A new verification code has been sent to your email.");
      setOtp(''); // Clear the input
    } catch (err: any) {
      const msg = 
        err.response?.data?.error ?? 
        err.response?.data?.message ??
        err.error ??
        err.message ?? 
        "Failed to resend code.";
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
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
          <Text className="text-2xl font-bold text-gray-900 text-center">
            {isFromSignup ? "Verify your email" : "Check your email"}
          </Text>
          <Text className="text-gray-500 text-center mt-2 leading-5">
            {isFromSignup 
              ? `We sent a ${OTP_LENGTH}-digit verification code to\n` 
              : `We sent a ${OTP_LENGTH}-digit code to\n`
            }
            <Text className="font-semibold text-gray-700">{email || "your email"}</Text>
            {isFromSignup && (
              <Text className="text-gray-500">{"\n"}Please verify to complete your registration</Text>
            )}
          </Text>
        </View>

        {/* Email input (editable if not provided via context) */}
        {!initialEmail && (
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">Email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#9ca3af"
              style={{
                borderWidth: 1,
                borderColor: '#e5e7eb',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: '#111827',
                backgroundColor: '#f9fafb'
              }}
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
            style={{
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 16,
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
              letterSpacing: 12,
              color: '#111827',
              backgroundColor: '#f9fafb'
            }}
            autoFocus={true}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
