import { Pressable, TouchableOpacity } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";

interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  onRemove?: () => void;
}

export function FilterChip({
  label,
  isActive,
  onPress,
  onRemove,
}: FilterChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center px-3 py-1.5 rounded-full mr-2 mb-2 ${
        isActive ? "bg-primary" : "bg-gray-100"
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          isActive ? "text-white" : "text-gray-700"
        }`}
      >
        {label}
      </Text>
      {isActive && onRemove && (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-2"
        >
          <IconSymbol name="xmark" size={12} color="white" />
        </Pressable>
      )}
    </TouchableOpacity>
  );
}

