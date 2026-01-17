import { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAtom } from 'jotai';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
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

  const handleSignup = async () => {
    // Validation
    if (!formData.email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!formData.password.trim() || formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const result = await api.auth.signup({
        email: formData.email.trim(),
        password: formData.password.trim(),
        phone: formData.phone.trim() || undefined,
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
          name: result.user?.name || '',
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
    } catch (error: any) {
      Alert.alert('Error', error?.error || 'Failed to create account. Please try again.');
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
      >
        <Pressable onPress={() => router.back()} className="mb-8">
          <IconSymbol name="chevron.left" size={24} color={Colors.light.icon} />
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
          <Input
            label="Email Address"
            placeholder="your@email.com"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="mb-4"
          />

          <Input
            label="Phone Number (Optional)"
            placeholder="+1234567890"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
            autoComplete="tel"
            className="mb-4"
          />

          <View className="mb-4">
            <Input
              label="Password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              endContent={
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="pr-3"
                >
                  <IconSymbol
                    name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                    size={20}
                    color={Colors.light.icon}
                  />
                </Pressable>
              }
            />
          </View>

          <View className="mb-6">
            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="password-new"
              endContent={
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="pr-3"
                >
                  <IconSymbol
                    name={showConfirmPassword ? 'eye.slash.fill' : 'eye.fill'}
                    size={20}
                    color={Colors.light.icon}
                  />
                </Pressable>
              }
            />
          </View>

          <Button
            onPress={handleSignup}
            disabled={loading}
            className="w-full h-14 rounded-2xl"
          >
            <Text className="text-white font-bold text-base">
              {loading ? 'Creating account...' : 'Sign Up'}
            </Text>
          </Button>
        </View>

        <View className="mt-auto pt-8">
          <Text className="text-center text-gray-400 text-sm">
            Already have an account?{' '}
            <Pressable onPress={() => router.push('/login')}>
              <Text className="text-primary font-semibold">Sign in</Text>
            </Pressable>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

