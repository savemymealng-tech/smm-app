import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NativeOnlyAnimatedView } from "@/components/ui/native-only-animated-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { Colors } from "@/constants/theme";
import {
  useHybridCart,
  useHybridClearCart,
  useHybridRemoveFromCart,
  useHybridUpdateCart
} from "@/lib/hooks/use-hybrid-cart";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Platform, RefreshControl, ScrollView, View } from "react-native";
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

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { 
    cart, 
    totalItems, 
    subtotal, 
    deliveryFee, 
    serviceFee, 
    tax, 
    isLoading, 
    isAuthenticated, 
    refetch 
  } = useHybridCart();
  const updateCartMutation = useHybridUpdateCart();
  const removeFromCartMutation = useHybridRemoveFromCart();
  const clearCartMutation = useHybridClearCart();

  // Dialog states
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<number | string | null>(null);

  // Calculate total from values (server provides fees, or they're 0)
  const total = subtotal + deliveryFee + serviceFee + tax;
  
  const totals = {
    subtotal,
    deliveryFee,
    serviceFee,
    tax,
    total,
  };

  const handleRemoveItem = (id: number | string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setItemToRemove(id);
    setRemoveDialogOpen(true);
  };

  const confirmRemoveItem = () => {
    if (itemToRemove !== null) {
      removeFromCartMutation.mutate(itemToRemove);
    }
    setRemoveDialogOpen(false);
    setItemToRemove(null);
  };

  const handleUpdateQuantity = (id: number | string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveItem(id);
      return;
    }
    
    if (isAuthenticated && typeof id === 'number') {
      updateCartMutation.mutate({ product_id: id, quantity });
    } else if (!isAuthenticated && typeof id === 'string') {
      updateCartMutation.mutate({ item_id: id, quantity });
    }
  };

  const handleCheckout = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    // Check if user is logged in
    if (!isAuthenticated) {
      setLoginDialogOpen(true);
      return;
    }
    
    router.push("/checkout");
  };

  const handleClearCart = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setClearDialogOpen(true);
  };

  const confirmClearCart = () => {
    clearCartMutation.mutate();
    setClearDialogOpen(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <CartHeader itemCount={0} onBack={() => router.back()} />
        <View className="p-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="w-full h-32 rounded-2xl mb-4" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

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

  // Group items by vendor - handle both API and local cart structures
  const itemsByVendor = cart.reduce((acc, item: any) => {
    // API cart structure: item.product.vendor
    // Local cart structure: item.product.vendor
    const vendor = item.product?.vendor;
    const vendorId = vendor?.id || 0;
    
    if (!acc[vendorId]) {
      acc[vendorId] = {
        vendor: vendor || { id: 0, business_name: 'Unknown Vendor' },
        items: [],
      };
    }
    acc[vendorId].items.push(item);
    return acc;
  }, {} as Record<string, { vendor: any; items: any[] }>);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <CartHeader itemCount={totalItems} onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={Colors.light.tint}
          />
        }
        contentContainerStyle={{
          paddingBottom: 220 + insets.bottom,
          paddingTop: 16,
        }}
      >
        <View className="px-4">
          {Object.values(itemsByVendor).map((vendorGroup, vendorIndex) => (
            <View key={vendorGroup.vendor.id} className="mb-6">
              {/* Vendor Header */}
              <View className="flex-row items-center mb-3 px-2">
                <Text className="text-lg font-bold text-gray-900">
                  {vendorGroup.vendor.business_name}
                </Text>
                <Text className="text-sm text-gray-500 ml-2">
                  ({vendorGroup.items.length} {vendorGroup.items.length === 1 ? 'item' : 'items'})
                </Text>
              </View>

              {/* Vendor Items */}
              {vendorGroup.items.map((item: any, index: number) => {
                const itemId = isAuthenticated ? item.product_id : item.id;
                return (
                  <NativeOnlyAnimatedView
                    key={itemId}
                    entering={FadeInDown.delay(index * 50)
                      .springify()
                      .damping(15)}
                    exiting={SlideOutDown.duration(300)}
                    className="mb-3"
                  >
                    <CartItemCard
                      item={item}
                      isAuthenticated={isAuthenticated}
                      onRemove={() => handleRemoveItem(itemId)}
                      onUpdateQuantity={(quantity) => handleUpdateQuantity(itemId, quantity)}
                    />
                  </NativeOnlyAnimatedView>
                );
              })}
            </View>
          ))}
        </View>
        <CartSummary
          totals={totals}
          onClearCart={handleClearCart}
          onCheckout={handleCheckout}
          bottomInset={insets.bottom}
        />
      </ScrollView>

      {/* Remove Item Dialog */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={confirmRemoveItem} className="bg-red-500">
              <Text className="text-white">Remove</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Cart Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all items from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={confirmClearCart} className="bg-red-500">
              <Text className="text-white">Clear All</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Login Required Dialog */}
      <AlertDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please login to proceed with checkout
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={() => {
              setLoginDialogOpen(false);
              router.push('/login');
            }}>
              <Text className="text-white">Login</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
}
