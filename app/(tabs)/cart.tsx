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
  const [itemToRemove, setItemToRemove] = useState<{ id: string; productId: number } | null>(null);

  // Calculate total from values (server provides fees, or they're 0)
  const total = subtotal + deliveryFee + serviceFee + tax;
  
  const totals = {
    subtotal,
    deliveryFee,
    serviceFee,
    tax,
    total,
  };

  const handleRemoveItem = (id: string, productId: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setItemToRemove({ id, productId });
    setRemoveDialogOpen(true);
  };

  const confirmRemoveItem = () => {
    if (itemToRemove !== null) {
      removeFromCartMutation.mutate(itemToRemove.id, itemToRemove.productId);
    }
    setRemoveDialogOpen(false);
    setItemToRemove(null);
  };

  const handleUpdateQuantity = (id: string, quantity: number, productId?: number) => {
    if (quantity < 1) {
      handleRemoveItem(id, productId || 0);
      return;
    }
    
    // Always pass item_id for local cart, and product_id for API sync
    updateCartMutation.mutate({ item_id: id, product_id: productId, quantity });
  };

  const handleUpdateFulfillmentMethod = (id: string, method: 'pickup' | 'delivery', productId?: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Find the current item to get its quantity
    const currentItem = cart.find(item => item.id === id);
    if (currentItem) {
      updateCartMutation.mutate({ 
        item_id: id, 
        product_id: productId, 
        quantity: currentItem.quantity,
        fulfillment_method: method 
      });
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
                // Always use local cart item.id now since we always return local cart
                const itemId = item.id;
                const productId = Number(item.productId);
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
                      onRemove={() => handleRemoveItem(itemId, productId)}
                      onUpdateQuantity={(quantity) => handleUpdateQuantity(itemId, quantity, productId)}
                      onUpdateFulfillmentMethod={(method) => handleUpdateFulfillmentMethod(itemId, method, productId)}
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
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Remove Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600 pt-1">
              Are you sure you want to remove this item from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="flex-1">
              <Text className="text-gray-700">Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={confirmRemoveItem} className="flex-1 bg-red-500">
              <Text className="text-white font-semibold">Remove</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Cart Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Clear Cart?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600 pt-1">
              Are you sure you want to remove all items from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="flex-1">
              <Text className="text-gray-700">Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={confirmClearCart} className="flex-1 bg-red-500">
              <Text className="text-white font-semibold">Clear All</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Login Required Dialog */}
      <AlertDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              🔐 Login Required
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600 pt-1">
              You need to be logged in to proceed with checkout. Your cart items will be saved and synced once you login!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="flex-1">
              <Text className="text-gray-700">Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction 
              onPress={() => {
                setLoginDialogOpen(false);
                router.push('/login');
              }}
              className="flex-1 bg-[#1E8449]"
            >
              <Text className="text-white font-semibold">Login</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SafeAreaView>
  );
}
