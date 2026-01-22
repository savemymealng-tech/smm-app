import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { MenuItem } from './SettingsMenuItem';
import { SettingsMenuItem } from './SettingsMenuItem';

type SettingsSectionProps = {
  title: string;
  items: MenuItem[];
};

export function SettingsSection({ title, items }: SettingsSectionProps) {
  return (
    <View className="mb-8">
      <Text className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 px-2">
        {title}
      </Text>
      <View className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
        {items.map((item, itemIndex) => (
          <SettingsMenuItem
            key={item.label}
            item={item}
            isLast={itemIndex === items.length - 1}
          />
        ))}
      </View>
    </View>
  );
}
