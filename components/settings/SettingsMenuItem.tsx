import { Pressable, Switch, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Text } from '@/components/ui/text';

export type MenuItem = {
  icon: string;
  label: string;
  onPress: () => void;
  showArrow?: boolean;
  showSwitch?: boolean;
  switchValue?: boolean;
  textColor?: string;
};

type SettingsMenuItemProps = {
  item: MenuItem;
  isLast: boolean;
};

export function SettingsMenuItem({ item, isLast }: SettingsMenuItemProps) {
  return (
    <Pressable
      onPress={item.onPress}
      className={`flex-row items-center justify-between p-5 ${
        !isLast ? 'border-b border-gray-50' : ''
      }`}
    >
      <View className="flex-row items-center flex-1">
        <View 
          className="w-9 h-9 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: `${item.textColor?.includes('red') ? "#fee2e2" : "#f8f9fa"}` }}
        >
          <IconSymbol 
            name={item.icon} 
            size={20} 
            color={item.textColor?.includes('red') ? "#ef4444" : "#5f6368"} 
          />
        </View>
        <Text className={`text-base font-medium ${item.textColor || 'text-gray-800'}`}>
          {item.label}
        </Text>
      </View>
      
      {item.showSwitch && (
        <Switch
          value={item.switchValue}
          onValueChange={item.onPress}
          trackColor={{ false: '#e2e8f0', true: '#15785B' }}
          thumbColor={'#ffffff'}
        />
      )}
      
      {item.showArrow && (
        <IconSymbol name="chevron.right" size={18} color="#dadce0" />
      )}
    </Pressable>
  );
}
