import { View, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useProfile } from "@/lib/hooks/use-profile";
import { useAtom } from "jotai";
import { persistAuthAtom } from "@/lib/atoms";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";

const ProfileMenuItem = ({
  icon,
  label,
  onPress,
  color = "#5f6368",
}: {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}) => (
  <Pressable
    onPress={onPress}
    className="flex-row items-center justify-between py-4"
  >
    <View className="flex-row items-center">
      <View
        className="w-10 h-10 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: `${color}10` }}
      >
        <IconSymbol name={icon} size={22} color={color} />
      </View>
      <Text className="text-base font-medium text-gray-800">{label}</Text>
    </View>
    <IconSymbol name="chevron.right" size={18} color="#dadce0" />
  </Pressable>
);

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { data: user, isLoading, isFetching } = useProfile();
  const [, setAuth] = useAtom(persistAuthAtom);

  const handleLogout = async () => {
    setAuth({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null
    });
    router.replace("/");
  };

  // Only show loading if we are actually fetching and don't have data yet
  if (isLoading && isFetching && !user) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">Loading your profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">Account</Text>
        <Pressable
          onPress={() => router.push("/settings")}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <IconSymbol name="gear.fill" size={24} color={Colors.light.icon} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        // style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <View className="items-center py-8">
          <View className="relative">
            <View className="w-24 h-24 rounded-full bg-blue-600 items-center justify-center shadow-lg border-4 border-white">
              <Text className="text-white text-4xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <Pressable className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full items-center justify-center shadow-md border border-gray-100">
              <IconSymbol name="camera" size={16} color={Colors.light.tint} />
            </Pressable>
          </View>
          <Text className="text-2xl font-bold mt-4 text-gray-900">
            {user?.name || "User Name"}
          </Text>
          <Text className="text-gray-500 mt-1">
            {user?.email || "user@example.com"}
          </Text>
          <Pressable
            onPress={() => router.push("/settings")}
            className="mt-4 px-6 py-2 rounded-full border border-gray-200"
          >
            <Text className="text-sm font-semibold text-gray-700">
              Manage your Account
            </Text>
          </Pressable>
        </View>

        <View className="h-2 bg-gray-50" />

        <View className="px-6 py-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Activity
          </Text>
          <ProfileMenuItem
            icon="calendar"
            label="Order History"
            onPress={() => router.push("/orders")}
            color="#1a73e8"
          />
          <ProfileMenuItem
            icon="heart.fill"
            label="Favorite Restaurants"
            onPress={() => { }}
            color="#ea4335"
          />
        </View>

        <View className="h-px bg-gray-100 mx-6" />

        <View className="px-6 py-4">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
            Delivery
          </Text>
          <ProfileMenuItem
            icon="location.fill"
            label="Saved Addresses"
            onPress={() => router.push("/addresses")}
            color="#34a853"
          />
        </View>

        <View className="h-2 bg-gray-50" />

        <View className="px-6 py-6 gap-3">
          <Button
            variant="outline"
            onPress={handleLogout}
            className="w-full border-gray-200 rounded-2xl h-14"
          >
            <Text className="text-red-600 font-bold">Log Out</Text>
          </Button>
          <View className="items-center">
            <Text className="text-gray-400 text-[10px] uppercase tracking-[2px] font-bold">
              Savemymeal v1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
