import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';
import { Colors } from '@/constants/theme';

export function SettingsHeader() {
  const router = useRouter();

  return (
    <View className="px-4 py-4 flex-row items-center border-b border-gray-100">
      <Pressable 
        onPress={() => router.back()} 
        className="w-10 h-10 rounded-full items-center justify-center -ml-2"
      >
        <IconSymbol name="chevron.left" size={24} color={Colors.light.text} />
      </Pressable>
      <Text className="text-xl font-bold ml-2 text-gray-900">Settings</Text>
    </View>
  );
}
