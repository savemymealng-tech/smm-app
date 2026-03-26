/**
 * Verify Reset Code Screen
 * 
 * Customer enters the 6-digit code received via email to verify identity before password reset
 */

import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { passwordResetContextAtom } from "@/lib/atoms/auth";
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

const CODE_LENGTH = 6;

export default function VerifyResetCodeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [passwordResetContext, setPasswordResetContext] = useAtom(passwordResetContextAtom);

  const initialEmail = passwordResetContext?.email || "";

  const [code, setCode] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<TextInput>(null);

  // Clear context after reading
  useEffect(() => {
    if (passwordResetContext?.email) {
      console.log('🔑 [VerifyResetCode] Reset context:', passwordResetContext);
    }
  }, []);

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleVerifyCode = async () => {
    const finalEmail = email.trim();
    
    if (!finalEmail) {
      toast.warning("Email Required", "Please enter your email address");
      return;
    }
    
    if (code.length !== CODE_LENGTH) {
      toast.warning("Invalid Code", `Please enter the ${CODE_LENGTH}-digit code`);
      return;
    }

    setLoading(true);
    try {
      await api.auth.verifyResetCode(finalEmail, code);
      
      // Update context with verified code
      setPasswordResetContext({
        email: finalEmail,
        code: code,
      });

      toast.success("Code Verified", "You can now set your new password");
      
      // Navigate to new password screen
      setTimeout(() => {
        router.push("/new-password");
      }, 50);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ??
        err.response?.data?.message ??
        err.error ??
        err.message ??
        "Invalid or expired code. Please try again.";
      toast.error("Verification Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const finalEmail = email.trim();
    
    if (!finalEmail) {
      toast.warning("Email Required", "Please enter your email address");
      return;
    }

    setResending(true);
    try {
      await api.auth.resendResetCode(finalEmail);
      setCountdown(60); // 60 second cooldown
      toast.success("Code Sent", "A new verification code has been sent to your email");
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
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 24,
          minHeight: '100%',
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Pressable onPress={() => router.back()} className="mb-8">
          <IconSymbol name="arrow.left" size={24} color="#000" />
        </Pressable>

        <View className="flex-1">
          {/* Icon */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4">
              <IconSymbol name="envelope.badge.fill" size={36} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">
              Check your email
            </Text>
            <Text className="text-gray-500 text-center mt-2 leading-5">
              We sent a {CODE_LENGTH}-digit code to{"\n"}
              <Text className="font-semibold text-gray-700">{email || "your email"}</Text>
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
                  backgroundColor: '#f9fafb',
                }}
              />
            </View>
          )}

          {/* Code input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Verification code
            </Text>
            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, CODE_LENGTH))}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={CODE_LENGTH}
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
                backgroundColor: '#f9fafb',
              }}
              autoFocus={true}
            />
          </View>

          {/* Verify button */}
          <Button
            onPress={handleVerifyCode}
            disabled={loading || code.length !== CODE_LENGTH}
            className="w-full mb-4"
          >
            {loading ? (
              <View className="flex-row items-center justify-center gap-2">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold">Verifying…</Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-base">Verify Code</Text>
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
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Text className="text-[#3b82f6] font-semibold">Resend</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
