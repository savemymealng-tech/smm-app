import { ActivityIndicator, Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import type { Meal } from "@/types/api";

interface AddToCartButtonProps {
  product: Meal;
  quantity: number;
  selectedCustomizations: Record<string, string[]>;
  onQuantityChange: (newQuantity: number) => void;
  onAddToCart: () => void;
  isLoading?: boolean;
}

export function AddToCartButton({
  product,
  quantity,
  selectedCustomizations,
  onQuantityChange,
  onAddToCart,
  isLoading = false,
}: AddToCartButtonProps) {
  const insets = useSafeAreaInsets();
  const price = parseFloat(product.price);
  const totalPrice = price * quantity;
  const maxQuantity = product.quantity_available;
  const isMaxedOut = quantity >= maxQuantity ? true : false;
  
  // Ensure quantity is at least 1 on mount
  if (quantity < 1 && maxQuantity > 0) {
    onQuantityChange(1);
  }

  if (!product.is_available || !maxQuantity || maxQuantity === 0) {
    return (
      <View
        className="bg-white border-t border-gray-200 px-6 py-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="bg-gray-100 rounded-2xl py-4 px-4 items-center">
          <Text className="text-gray-500 font-semibold text-base">
            Currently Unavailable
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      className="bg-white border-t border-gray-100 px-6 py-4"
      style={{ 
        paddingBottom: Math.max(insets.bottom, 16),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 5,
      }}
    >
      {/* Quantity Selector */}
      <View className="flex-row items-center justify-between px-4 mb-4">
        <View className="flex-1 mr-4">
          <Text className="text-xs text-gray-500 mb-0.5">Quantity</Text>
          <Text className="text-sm text-gray-400">
            {maxQuantity} available
          </Text>
        </View>
        
        <View className="flex-row items-center bg-gray-50 rounded-full px-2 py-1.5">
          <Pressable
            onPress={() => {
              if (quantity > 1) {
                onQuantityChange(quantity - 1);
              }
            }}
            disabled={quantity <= 1}
            className={`w-9 h-9 rounded-full items-center justify-center ${
              quantity <= 1
                ? "bg-gray-200"
                : "bg-white shadow-sm"
            }`}
          >
            <IconSymbol
              name="minus"
              size={18}
              color={quantity <= 1 ? "#d1d5db" : "#374151"}
            />
          </Pressable>
          
          <Text className="mx-5 text-lg font-bold text-gray-900 min-w-[32px] text-center">
            {quantity}
          </Text>
          
          <Pressable
            onPress={() => {
              if (quantity < maxQuantity) {
                onQuantityChange(quantity + 1);
              }
            }}
            disabled={isMaxedOut}
            className={`w-9 h-9 rounded-full items-center justify-center ${
              isMaxedOut
                ? "bg-gray-200"
                : "bg-white shadow-sm"
            }`}
          >
            <IconSymbol 
              name="plus" 
              size={18} 
              color={isMaxedOut ? "#d1d5db" : "#374151"} 
            />
          </Pressable>
        </View>
      </View>

      {/* Add to Cart Button */}
      <Pressable
        onPress={onAddToCart}
        disabled={isLoading || (isMaxedOut && quantity === 0)}
        style={{
          backgroundColor: isLoading ? "#15803d" : "#1E8449",
          borderRadius: 16,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <IconSymbol name="cart.fill" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">
              Add to Cart • ₦{totalPrice.toFixed(0)}
            </Text>
          </>
        )}
      </Pressable>
      
      {isMaxedOut && (
        <Text className="text-amber-600 text-xs text-center mt-2">
          Maximum available quantity selected
        </Text>
      )}
    </View>
  );
}

