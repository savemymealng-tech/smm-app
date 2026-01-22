import { router } from 'expo-router';
import { useAtom } from 'jotai';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';
import { api } from '@/lib/api';
import { setAuthStateAtom } from '@/lib/atoms/auth';
import type { User } from '@/types';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [, setAuthState] = useAtom(setAuthStateAtom);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    // Validation
    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!formData.password.trim() || formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await api.auth.signup({
        email: formData.email.trim(),
        password: formData.password.trim(),
        phone: formData.phone.trim(),
      });
      
      // Fetch full user profile after signup
      let user: User | null = null;
      try {
        user = await api.profile.getProfile();
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
        // Create a basic user object from auth response
        user = {
          id: result.user?.id?.toString() || '',
          email: result.user?.email || formData.email,
          name: '',
          phone: formData.phone || '',
          addresses: [],
          paymentMethods: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      await setAuthState({
        user,
        accessToken: result.token,
        refreshToken: result.refreshToken || '',
      });

      router.replace('/(tabs)');
    } catch (err: any) {
      // Extract the most user-friendly error message
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (err?.error) {
        errorMessage = err.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('duplicate') || 
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('user already')) {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (errorMessage.toLowerCase().includes('invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (errorMessage.toLowerCase().includes('password')) {
        errorMessage = 'Password does not meet requirements. Please use at least 6 characters.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
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
        <Pressable onPress={() => router.back()} className="mb-8">
          <IconSymbol 
            name="chevron.left" 
            size={24} 
            color="#111827" 
          />
        </Pressable>

        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-[#15785B] items-center justify-center mb-4 overflow-hidden">
            <Image 
              source={require('@/assets/adaptive-icon.png')} 
              style={{ width: 60, height: 60 }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </Text>
          <Text className="text-gray-500 text-center">
            Sign up to start ordering delicious meals
          </Text>
        </View>

        <View className="mb-6">
          {/* Error Message */}
          {error ? (
            <View className="mb-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <Text className="text-red-800 text-sm">
                {error}
              </Text>
            </View>
          ) : null}

          {/* Email Field */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Email Address
            </Text>
            <TextInput
              placeholder="your@email.com"
              value={formData.email}
              onChangeText={(text) => {
                setFormData({ ...formData, email: text });
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              placeholderTextColor="#6b7280"
              style={{
                height: 56,
                paddingHorizontal: 16,
                fontSize: 16,
                color: '#111827',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            />
          </View>

          {/* Phone Field */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </Text>
            <TextInput
              placeholder="+234 801 234 5678"
              value={formData.phone}
              onChangeText={(text) => {
                setFormData({ ...formData, phone: text });
                if (error) setError('');
              }}
              keyboardType="phone-pad"
              autoCapitalize="none"
              autoComplete="tel"
              placeholderTextColor="#6b7280"
              style={{
                height: 56,
                paddingHorizontal: 16,
                fontSize: 16,
                color: '#111827',
                backgroundColor: '#f9fafb',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#e5e7eb',
              }}
            />
          </View>

          {/* Password Field */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Password
            </Text>
            <View className="relative">
              <TextInput
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  if (error) setError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                placeholderTextColor="#6b7280"
                style={{
                  height: 56,
                  paddingHorizontal: 16,
                  paddingRight: 50,
                  fontSize: 16,
                  color: '#111827',
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <IconSymbol
                  name={showPassword ? 'eye.slash' : 'eye'}
                  size={20}
                  color="#6b7280"
                />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password Field */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </Text>
            <View className="relative">
              <TextInput
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChangeText={(text) => {
                  setFormData({ ...formData, confirmPassword: text });
                  if (error) setError('');
                }}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                placeholderTextColor="#6b7280"
                style={{
                  height: 56,
                  paddingHorizontal: 16,
                  paddingRight: 50,
                  fontSize: 16,
                  color: '#111827',
                  backgroundColor: '#f9fafb',
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e5e7eb',
                }}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <IconSymbol
                  name={showConfirmPassword ? 'eye.slash' : 'eye'}
                  size={20}
                  color="#6b7280"
                />
              </Pressable>
            </View>
          </View>

          {/* Submit Button */}
          <Button
            onPress={handleSignup}
            disabled={loading}
            className="w-full h-14 rounded-2xl"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Create Account
              </Text>
            )}
          </Button>
        </View>

        <View className="mt-auto pt-8">
          <View className="flex-row justify-center items-center mb-6">
            <Text className="text-center text-gray-400 text-sm">
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text className="text-blue-600 font-semibold">
                Sign in
              </Text>
            </Pressable>
          </View>

          <Text className="text-xs text-center text-gray-500 px-4">
            By signing up, you agree to our{' '}
            <Text className="text-blue-600">Terms of Service</Text>
            {' '}and{' '}
            <Text className="text-blue-600">Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

