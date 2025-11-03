import { Button } from "@/components/ui/button";
import { NativeOnlyAnimatedView } from "@/components/ui/native-only-animated-view";
import { Text } from "@/components/ui/text";
import { formatCurrency } from "@/lib/utils";
import { Pressable, View } from "react-native";
import { FadeIn } from "react-native-reanimated";
import type { CartTotals } from "../../types";

interface CartSummaryProps {
  totals: CartTotals;
  onClearCart: () => void;
  onCheckout: () => void;
  bottomInset: number;
}

export function CartSummary({
  totals,
  onClearCart,
  onCheckout,
  bottomInset,
}: CartSummaryProps) {
  return (
    <NativeOnlyAnimatedView
      entering={FadeIn.delay(200).duration(400).springify()}
      className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg"
      style={{ paddingBottom: Math.max(bottomInset, 0) }}
    >
      {/* Order Summary */}
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-600 text-base">Subtotal</Text>
          <Text className="text-gray-900 font-semibold text-base">
            {formatCurrency(totals.subtotal)}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-600 text-base">Delivery Fee</Text>
          <Text className="text-gray-900 font-semibold text-base">
            {formatCurrency(totals.deliveryFee)}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-600 text-base">Tax</Text>
          <Text className="text-gray-900 font-semibold text-base">
            {formatCurrency(totals.tax)}
          </Text>
        </View>
        <View className="border-t border-gray-200 pt-3 mb-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-900 font-bold text-lg">Total</Text>
            <Text className="text-gray-900 font-bold text-xl">
              {formatCurrency(totals.total)}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="px-4 pb-4">
        <Pressable
          onPress={onClearCart}
          className="mb-3 py-3 items-center justify-center active:opacity-70"
        >
          <Text className="text-red-600 font-medium text-base">
            Clear Cart
          </Text>
        </Pressable>

        <Button onPress={onCheckout} className="w-full py-4 rounded-xl shadow-md">
          <Text className="text-white font-semibold text-base">
            Proceed to Checkout
          </Text>
        </Button>
      </View>
    </NativeOnlyAnimatedView>
  );
}

