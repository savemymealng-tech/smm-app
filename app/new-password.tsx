/**
 * New Password Screen
 * 
 * Customer creates a new password after code verification
 */

import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { toast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { passwordResetContextAtom } from "@/lib/atoms/auth";
import { useRouter } from "expo-router";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [passwordResetContext, setPasswordResetContext] = useAtom(passwordResetContextAtom);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const email = passwordResetContext?.email || "";
  const code = passwordResetContext?.code || "";

  console.log('🔑 [NewPassword] Context:', { email, code: code ? '***' : null });

  useEffect(() => {
    // Verify we have the required context
    if (!email || !code) {
      toast.error("Invalid Access", "Please start from the forgot password screen");
      router.replace("/forgot-password");
    }
  }, []);

  const handleResetPassword = async () => {
    if (!email || !code) {
      toast.error("Invalid Session", "Please start the password reset process again");
      router.replace("/forgot-password");
      return;
    }

    if (!newPassword.trim()) {
      toast.warning("Password Required", "Please enter your new password");
      return;
    }

    if (newPassword.length < 6) {
      toast.warning("Password Too Short", "Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warning("Passwords Don't Match", "Please make sure both passwords are identical");
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPasswordWithCode({
        email,
        code,
        newPassword: newPassword.trim(),
      });

      // Clear the reset context
      setPasswordResetContext({
        email: null,
        code: null,
      });

      // Show success alert and navigate to login
      Alert.alert(
        "Password Reset Successfully!",
        "Your password has been changed. You can now log in with your new password.",
        [
          {
            text: "Go to Login",
            onPress: () => router.replace("/login"),
          },
        ],
        { cancelable: false }
      );
    } catch (err: any) {
      const msg =
        err.response?.data?.error ??
        err.response?.data?.message ??
        err.error ??
        err.message ??
        "Failed to reset password. The code may have expired.";
      toast.error("Reset Failed", msg);
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
            <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4">
              <IconSymbol name="lock.fill" size={36} color="#1E8449" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 text-center">
              Create new password
            </Text>
            <Text className="text-gray-500 text-center mt-2 leading-5">
              Your new password must be at least 6 characters long
            </Text>
          </View>

          {/* New Password */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">New Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Enter new password"
                secureTextEntry={!showNew}
                placeholderTextColor="#9ca3af"
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  paddingRight: 48,
                  fontSize: 16,
                  color: '#111827',
                  backgroundColor: '#f9fafb',
                }}
              />
              <Pressable
                onPress={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 12,
                  padding: 4,
                }}
              >
                <IconSymbol
                  name={showNew ? "eye.slash.fill" : "eye.fill"}
                  size={20}
                  color="#9ca3af"
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">Confirm Password</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter new password"
                secureTextEntry={!showConfirm}
                placeholderTextColor="#9ca3af"
                style={{
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  paddingRight: 48,
                  fontSize: 16,
                  color: '#111827',
                  backgroundColor: '#f9fafb',
                }}
              />
              <Pressable
                onPress={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 12,
                  padding: 4,
                }}
              >
                <IconSymbol
                  name={showConfirm ? "eye.slash.fill" : "eye.fill"}
                  size={20}
                  color="#9ca3af"
                />
              </Pressable>
            </View>
          </View>

          {/* Reset Button */}
          <Button
            onPress={handleResetPassword}
            disabled={loading || !newPassword || !confirmPassword}
            className="w-full"
          >
            {loading ? (
              <View className="flex-row items-center justify-center gap-2">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold">Resetting…</Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-base">Reset Password</Text>
            )}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
