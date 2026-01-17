import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { NativeOnlyAnimatedView } from "@/components/ui/native-only-animated-view";
import { Text } from "@/components/ui/text";
import { View } from "react-native";
import { FadeIn, FadeInDown } from "react-native-reanimated";

interface CartEmptyStateProps {
  onBackToExplore: () => void;
}

export function CartEmptyState({ onBackToExplore }: CartEmptyStateProps) {
  return (
    <View className="flex-1 w-full items-center justify-center px-4">
      <NativeOnlyAnimatedView
        entering={FadeIn.delay(200).duration(400)}
        className="items-center justify-center"
      >
        <NativeOnlyAnimatedView
          entering={FadeInDown.delay(300).springify()}
          style={{ margin: "auto" }}
          className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center mb-6 shadow-lg mx-auto"
        >
          <IconSymbol name="cart" size={48} color="#9ca3af" />
        </NativeOnlyAnimatedView>
        <Text className="text-2xl text-center font-bold mb-2 text-gray-900">
          Your cart is empty
        </Text>
        <Text className="text-gray-600 text-center mb-8 text-base">
          Add some delicious meals to get started!
        </Text>
      </NativeOnlyAnimatedView>
    </View>
  );
}

