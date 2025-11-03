import { View, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useProfile } from '@/lib/hooks/use-profile';
import { useAtom } from 'jotai';
import { persistAuthAtom } from '@/lib/atoms';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data: user, isLoading } = useProfile();
  const [, setAuth] = useAtom(persistAuthAtom);

  const handleLogout = async () => {
    setAuth({ user: null, isAuthenticated: false, isLoading: false });
    router.replace('/');
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      <View className="px-4 py-3 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold">Profile</Text>
      </View>
      
      <ScrollView className="flex-1">
        <View className="px-4 py-6 bg-white border-b border-gray-100">
          <View className="items-center">
            <View className="w-24 h-24 rounded-full bg-blue-600 items-center justify-center mb-3 shadow-md">
              {user?.avatar ? (
                <Text className="text-4xl">👤</Text>
              ) : (
                <Text className="text-white text-4xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              )}
            </View>
            <Text className="text-2xl font-bold">{user?.name || 'User Name'}</Text>
            <Text className="text-gray-600">{user?.email || 'user@example.com'}</Text>
          </View>
        </View>

        <View className="px-4 py-4">
        <Pressable
          onPress={() => router.push('/orders')}
          className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row items-center">
            <IconSymbol name="calendar" size={24} color="#666" />
            <Text className="font-semibold ml-3">Order History</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#666" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/addresses')}
          className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row items-center">
            <IconSymbol name="location.fill" size={24} color="#666" />
            <Text className="font-semibold ml-3">Saved Addresses</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#666" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/payments')}
          className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row items-center">
            <IconSymbol name="creditcard.fill" size={24} color="#666" />
            <Text className="font-semibold ml-3">Payment Methods</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#666" />
        </Pressable>

        <Pressable
          onPress={() => router.push('/settings')}
          className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-3 shadow-sm">
          <View className="flex-row items-center">
            <IconSymbol name="gear.fill" size={24} color="#666" />
            <Text className="font-semibold ml-3">Settings</Text>
          </View>
          <IconSymbol name="chevron.right" size={20} color="#666" />
        </Pressable>

        <View className="px-4 py-6 mt-4">
          <Button variant="outline" onPress={handleLogout} className="w-full">
            Log Out
          </Button>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

