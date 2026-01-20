import { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert, Image, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAtom } from 'jotai';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { api } from '@/lib/api';
import { setAuthStateAtom } from '@/lib/atoms/auth';
import type { User } from '@/types';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [, setAuthState] = useAtom(setAuthStateAtom);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!password.trim() || password.length < 6) {
      setError('Please enter a valid password (minimum 6 characters)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await api.auth.login({
        email: email.trim(),
        password: password.trim(),
      });
      
      // Fetch full user profile after login
      let user: User | null = null;
      try {
        user = await api.profile.getProfile();
      } catch (profileError) {
        console.error('Error fetching profile:', profileError);
        // Create a basic user object from auth response
        user = {
          id: result.user?.id?.toString() || '',
          email: result.user?.email || email,
          name: '',
          phone: '',
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
      let errorMessage = 'Invalid email or password';
      
      if (err?.error) {
        errorMessage = err.error;
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      // Handle specific error cases
      if (errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('does not exist')) {
        errorMessage = 'No account found with this email. Please sign up first.';
      } else if (errorMessage.toLowerCase().includes('incorrect') ||
                 errorMessage.toLowerCase().includes('invalid password') ||
                 errorMessage.toLowerCase().includes('wrong password')) {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (errorMessage.toLowerCase().includes('blocked') ||
                 errorMessage.toLowerCase().includes('suspended')) {
        errorMessage = 'Your account has been suspended. Please contact support.';
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
        <Pressable 
          onPress={() => router.replace('/(tabs)')} 
          className="mb-8"
        >
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
            Welcome Back
          </Text>
          <Text className="text-gray-500 text-center">
            Sign in to continue to Savemymeal
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
              value={email}
              onChangeText={(text) => {
                setEmail(text);
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

          {/* Password Field */}
          <View className="mb-2">
            <Text className="text-sm font-medium text-gray-700 mb-2">
              Password
            </Text>
            <View className="relative">
              <TextInput
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
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
                className="absolute right-4 top-4"
              >
                <IconSymbol
                  name={showPassword ? 'eye.slash' : 'eye'}
                  size={20}
                  color="#6b7280"
                />
              </Pressable>
            </View>
          </View>

          {/* Forgot Password */}
          <Pressable
            onPress={() => Alert.alert('Forgot Password', 'Password reset feature coming soon!')}
            className="self-end mb-6"
          >
            <Text className="text-blue-600 text-sm font-medium">
              Forgot Password?
            </Text>
          </Pressable>

          {/* Submit Button */}
          <Button
            onPress={handleLogin}
            disabled={loading}
            className="w-full h-14 rounded-2xl"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-base">
                Sign In
              </Text>
            )}
          </Button>
        </View>

        <View className="mt-auto pt-8">
          <View className="flex-row justify-center items-center">
            <Text className="text-center text-gray-400 text-sm">
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text className="text-blue-600 font-semibold">
                Sign up
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
