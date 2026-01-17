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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [, setAuthState] = useAtom(setAuthStateAtom);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!password.trim() || password.length < 6) {
      Alert.alert('Error', 'Please enter a valid password (minimum 6 characters)');
      return;
    }

    setLoading(true);
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
          name: result.user?.name || '',
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
    } catch (error: any) {
      Alert.alert('Error', error?.error || 'Invalid email or password');
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
        <Pressable 
          onPress={() => {
            // Navigate back to home tabs
            // This ensures the back button always works
            router.replace('/(tabs)');
          }} 
          className="mb-8"
        >
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
            Welcome Back
          </Text>
          <Text className="text-gray-500 text-center">
            Sign in to continue to Savemymeal
          </Text>
        </View>

        <View className="mb-6">
          <Input
            label="Email Address"
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="mb-4"
          />

          <View className="mb-4">
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
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

          <Button
            onPress={handleLogin}
            disabled={loading}
            className="w-full h-14 rounded-2xl"
          >
            <Text className="text-white font-bold text-base">
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </Button>
        </View>

        <Pressable
          onPress={() => {
            Alert.alert('Forgot Password', 'Password reset feature coming soon!');
          }}
          className="items-center py-4"
        >
          <Text className="text-blue-600 font-semibold">
            Forgot Password?
          </Text>
        </Pressable>

        <View className="mt-auto pt-8">
          <Text className="text-center text-gray-400 text-sm">
            Don't have an account?{' '}
            <Pressable onPress={() => router.push('/signup')}>
              <Text className="text-blue-600 font-semibold">Sign up</Text>
            </Pressable>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
