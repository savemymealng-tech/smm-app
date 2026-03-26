/**
 * Reset Password Screen
 *
 * Reached via deep link:
 *   savemymeal://reset-password?token=abc123xyz
 *   https://savemymeal.com/app/reset-password?token=abc123xyz
 *   https://savemymeal.com/app/redirect?path=/reset-password&params=token=abc123xyz
 */

import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { token } = useLocalSearchParams<{ token?: string }>();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!token) {
      toast.error("Invalid Link", "This password reset link is invalid or has expired.");
      return;
    }
    if (newPassword.length < 6) {
      toast.warning("Password Too Short", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning("Passwords Don't Match", "Please make sure both passwords are identical.");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword({ token, newPassword });
      setDone(true);
      toast.success("Password Updated", "Your password has been changed successfully.");
    } catch (err: any) {
      const msg =
        err.response?.data?.error ?? err.message ?? "Failed to reset password. The link may have expired.";
      toast.error("Reset Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <View
        className="flex-1 bg-white items-center justify-center px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="w-24 h-24 rounded-full bg-green-50 items-center justify-center mb-6">
          <IconSymbol name="checkmark.circle.fill" size={52} color="#1E8449" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
          Password Updated!
        </Text>
        <Text className="text-gray-500 text-center leading-5 mb-8">
          Your password has been reset successfully. You can now log in with your new password.
        </Text>
        <Button onPress={() => router.replace("/login")} className="w-full">
          <Text className="text-white font-semibold text-base">Go to Login</Text>
        </Button>
      </View>
    );
  }

  // ── Invalid token ──────────────────────────────────────────────────────────
  if (!token) {
    return (
      <View
        className="flex-1 bg-white items-center justify-center px-6"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="w-20 h-20 rounded-full bg-red-50 items-center justify-center mb-6">
          <IconSymbol name="exclamationmark.triangle.fill" size={40} color="#dc2626" />
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center mb-3">
          Invalid Reset Link
        </Text>
        <Text className="text-gray-500 text-center leading-5 mb-8">
          This link is invalid or has expired. Please request a new password reset.
        </Text>
        <Button variant="outline" onPress={() => router.replace("/login")} className="w-full">
          <Text className="font-semibold">Back to Login</Text>
        </Button>
      </View>
    );
  }

  // ── Reset form ─────────────────────────────────────────────────────────────
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
          <Text className="text-xl font-bold">Reset Password</Text>
        </View>

        <View className="flex-1 px-6 pt-6">
        {/* Icon */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4">
            <IconSymbol name="lock.rotation" size={36} color="#1E8449" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">
            Create new password
          </Text>
          <Text className="text-gray-500 text-center mt-2 leading-5">
            Your new password must be at least 6 characters long.
          </Text>
        </View>

        {/* New password */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">New password</Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-4">
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              secureTextEntry={!showNew}
              placeholderTextColor="#9ca3af"
              className="flex-1 py-3 text-base text-gray-900"
            />
            <Pressable onPress={() => setShowNew((v) => !v)} className="pl-2">
              <IconSymbol
                name={showNew ? "eye.slash.fill" : "eye.fill"}
                size={20}
                color="#9ca3af"
              />
            </Pressable>
          </View>
        </View>

        {/* Confirm password */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-700 mb-2">Confirm new password</Text>
          <View className="flex-row items-center border border-gray-200 rounded-xl bg-gray-50 px-4">
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry={!showConfirm}
              placeholderTextColor="#9ca3af"
              className="flex-1 py-3 text-base text-gray-900"
            />
            <Pressable onPress={() => setShowConfirm((v) => !v)} className="pl-2">
              <IconSymbol
                name={showConfirm ? "eye.slash.fill" : "eye.fill"}
                size={20}
                color="#9ca3af"
              />
            </Pressable>
          </View>
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <Text className="text-red-500 text-xs mt-1.5 ml-1">Passwords do not match</Text>
          )}
        </View>

        {/* Submit */}
        <Button
          onPress={handleReset}
          disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
          className="w-full"
        >
          {loading ? (
            <View className="flex-row items-center justify-center gap-2">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-semibold">Updating…</Text>
            </View>
          ) : (
            <Text className="text-white font-semibold text-base">Update Password</Text>
          )}
        </Button>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
