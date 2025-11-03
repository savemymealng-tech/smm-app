import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { Platform, ScrollView, View } from "react-native";
import { FadeInDown, SlideOutDown } from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  CartEmptyState,
  CartHeader,
  CartItemCard,
  CartSummary,
} from "@/components/cart";
import { NativeOnlyAnimatedView } from "@/components/ui/native-only-animated-view";
import { useCart } from "@/lib/hooks/use-cart";

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart, removeItem, clearCart, updateQuantity, getCartTotals } =
    useCart();

  const handleRemoveItem = (itemId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    removeItem(itemId);
  };

  const handleCheckout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/checkout");
  };

  const handleClearCart = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    clearCart();
  };

  if (cart.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <CartHeader itemCount={0} onBack={() => router.back()} />
        <View
          style={{ height: "100%" }}
          className="flex-1 justify-center items-center"
        >
          <CartEmptyState
            onBackToExplore={() => router.push("/(tabs)/explore")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const totals = getCartTotals();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <CartHeader itemCount={cart.length} onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 220 + insets.bottom,
          paddingTop: 16,
        }}
      >
        <View className="px-4">
          {cart.map((item, index) => (
            <NativeOnlyAnimatedView
              key={item.id}
              entering={FadeInDown.delay(index * 50)
                .springify()
                .damping(15)}
              exiting={SlideOutDown.duration(300)}
              className="mb-3"
            >
              <CartItemCard
                item={item}
                onRemove={() => handleRemoveItem(item.id)}
                onUpdateQuantity={updateQuantity}
              />
            </NativeOnlyAnimatedView>
          ))}
        </View>
        <CartSummary
          totals={totals}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
          bottomInset={insets.bottom}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
