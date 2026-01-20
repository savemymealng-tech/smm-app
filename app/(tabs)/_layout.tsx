import { Tabs, router } from 'expo-router';
import { useAtomValue } from 'jotai';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';
import { authAtom } from '@/lib/atoms/auth';
import { useHybridCart } from '@/lib/hooks/use-hybrid-cart';
import { ActivityIndicator, Platform, View } from 'react-native';

export default function TabLayout() {
  const authState = useAtomValue(authAtom);
  const { totalItems } = useHybridCart();

  const cartItemCount = totalItems;

  // Show loading while checking auth state
  if (authState.isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text className="text-gray-500 mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: "#5f6368",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          // height: 70,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          paddingBottom: Platform.OS === 'android' ? 10 : 0,
          backgroundColor: "#ffffff",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: Platform.OS === 'android' ? 10 : 0

        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="magnifyingglass" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="cart.fill" color={color} />,
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            // Check if user is authenticated before allowing tab navigation
            if (!authState.isAuthenticated) {
              e.preventDefault();
              router.push('/login');
            }
          },
        }}
      />
    </Tabs>
  );
}
