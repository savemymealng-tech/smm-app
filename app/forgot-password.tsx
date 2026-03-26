/**
 * Forgot Password Screen
 * 
 * Customer enters their email to receive a 6-digit password reset code
 */

import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { passwordResetContextAtom } from "@/lib/atoms/auth";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useState } from "react";
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

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [, setPasswordResetContext] = useAtom(passwordResetContextAtom);
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      toast.warning("Email Required", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.warning("Invalid Email", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.forgotPassword(email.trim());
      
      // Set context for next screen
      setPasswordResetContext({
        email: email.trim(),
        code: null,
      });

      toast.success("Code Sent", "Please check your email for the verification code");
      
      // Navigate to code verification screen with small delay
      setTimeout(() => {
        router.push("/verify-reset-code");
      }, 50);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ??
        err.response?.data?.message ??
        err.error ??
        err.message ??
        "Failed to send reset code. Please try again.";
      toast.error("Error", msg);
    } finally {
      setLoading(false);
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
              <IconSymbol name="lock.rotation" size={36} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">
              Reset Your Password
            </Text>
            <Text className="text-gray-500 text-center mt-2 leading-5">
              Enter your email address and we'll send you a code to reset your password
            </Text>
          </View>

          {/* Email Input */}
          <View className="mb-6">
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

          {/* Send Code Button */}
          <Button
            onPress={handleSendCode}
            disabled={loading}
            className="w-full mb-4"
          >
            {loading ? (
              <View className="flex-row items-center justify-center gap-2">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold">Sending...</Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-base">Send Reset Code</Text>
            )}
          </Button>

          {/* Back to Login */}
          <View className="flex-row items-center justify-center mt-4">
            <Text className="text-gray-500">Remember your password? </Text>
            <Pressable onPress={() => router.back()}>
              <Text className="text-[#1E8449] font-semibold">Back to Login</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
