import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs, router } from 'expo-router';
import { useAtomValue } from 'jotai';

import { HapticTab } from '@/components/haptic-tab';
import {
  House,
  Search,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Brand, Colors } from '@/constants/theme';
import { authAtom } from '@/lib/atoms/auth';
import { useHybridCart } from '@/lib/hooks/use-hybrid-cart';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

function TabIcon({
  icon: Icon,
  color,
  focused,
}: {
  icon: LucideIcon;
  color: string;
  focused: boolean;
}) {
  return (
    <View
      pointerEvents="none"
      style={[styles.icon, focused && styles.activeIcon]}
    >
      <Icon
        accessible={false}
        size={23}
        strokeWidth={focused ? 2.3 : 1.8}
        color={color}
      />
    </View>
  );
}

export default function TabLayout() {
  const authState = useAtomValue(authAtom);
  const insets = useSafeAreaInsets();
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
        tabBarInactiveTintColor: '#68756d',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 56 + insets.bottom,
          paddingTop: 4,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          paddingBottom: insets.bottom,
          backgroundColor: '#ffffff',
        },
        tabBarIconStyle: { width: 48, height: 30 },
        tabBarBadgeStyle: {
          backgroundColor: Brand.orange,
          color: '#352000',
          fontSize: 10,
          fontWeight: '700',
          minWidth: 18,
          height: 18,
          lineHeight: 18,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={House} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={Search} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={ShoppingBag} color={color} focused={focused} />
          ),
          tabBarBadge: cartItemCount > 0 ? cartItemCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon={UserRound} color={color} focused={focused} />
          ),
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

const styles = StyleSheet.create({
  icon: {
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIcon: {
    backgroundColor: Brand.greenSurface,
  },
});
