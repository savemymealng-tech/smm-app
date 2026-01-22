import { View } from 'react-native';

import { Text } from '@/components/ui/text';

export function AppInfo() {
  return (
    <View className="items-center py-8">
      <Text className="text-gray-400 text-xs font-bold uppercase tracking-widest">Savemymeal</Text>
      <Text className="text-gray-300 text-[10px] mt-1">v1.0.0 • Made with ?</Text>
    </View>
  );
}
