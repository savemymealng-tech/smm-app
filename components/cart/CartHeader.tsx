import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { Pressable, View } from "react-native";

interface CartHeaderProps {
  itemCount: number;
  onBack: () => void;
}

export function CartHeader({ itemCount, onBack }: CartHeaderProps) {
  return (
    <View
      className="px-4 py-4 bg-white flex-row items-center border-b border-gray-100 shadow-sm"
    >
      <Pressable
        onPress={onBack}
        className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3 active:bg-gray-200"
      >
        <IconSymbol name="chevron.left" size={20} color="#000" />
      </Pressable>
      <Text className="text-2xl text-gray-800 font-bold flex-1">Cart</Text>
      {itemCount > 0 && (
        <View className="px-3 py-1.5 rounded-full bg-gray-100">
          <Text className="text-gray-700 font-semibold text-sm">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
        </View>
      )}
    </View>
  );
}

