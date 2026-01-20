import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Text } from "@/components/ui/text";
import { useInitializePayment, usePlaceOrder, useVerifyPayment } from "@/lib/hooks";
import { useHybridCart, useHybridClearCart } from "@/lib/hooks/use-hybrid-cart";
import { useProfile } from "@/lib/hooks/use-profile";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@rn-primitives/context-menu";
import type { Address } from "../types";

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart, subtotal, deliveryFee, serviceFee, tax } = useHybridCart();
  const { data: user } = useProfile();
  const clearCartMutation = useHybridClearCart();
  
  const placeOrderMutation = usePlaceOrder();
  const initializePaymentMutation = useInitializePayment();
  const verifyPaymentMutation = useVerifyPayment();

  // Mock addresses for demo - in real app this would come from user profile
  const mockAddresses: Address[] = user?.addresses || [
    {
      id: "1",
      type: "home",
      label: "Home",
      street: "123 Main Street",
      city: "Lagos",
      state: "Lagos State",
      zipCode: "100001",
      country: "Nigeria",
      isDefault: true,
    },
    {
      id: "2",
      type: "work",
      label: "Office",
      street: "456 Business Ave",
      city: "Lagos",
      state: "Lagos State",
      zipCode: "100271",
      country: "Nigeria",
    },
  ];

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'card' | 'cash'>('cash');
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  // Set default address on mount or when mockAddresses changes
  useEffect(() => {
    if (!selectedAddress && mockAddresses.length > 0) {
      const defaultAddr = mockAddresses.find((a) => a.isDefault) || mockAddresses[0];
      setSelectedAddress(defaultAddr);
    }
  }, [mockAddresses, selectedAddress]);

  // Use fees from server (if available) or 0
  const total = subtotal + deliveryFee + serviceFee + tax;
  
  const totals = {
    subtotal,
    deliveryFee,
    serviceFee,
    tax,
    total,
  };

  const handlePlaceOrder = async () => {
    console.log('🛒 Place Order clicked', {
      hasAddress: !!selectedAddress,
      hasPayment: !!selectedPayment,
      cartLength: cart.length,
      isProcessing,
      cart: cart,
      user: user
    });

    if (!selectedAddress) {
      Alert.alert(
        "Missing Information",
        "Please select a delivery address."
      );
      return;
    }

    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Your cart is empty.");
      return;
    }

    setIsProcessing(true);

    try {
      // Map cart items to order format
      const orderItems = cart.map((item: any) => {
        const productId = item.product_id || item.productId || item.id || item.product?.id;
        console.log('Mapping cart item:', { item, productId });
        
        if (!productId) {
          throw new Error('Invalid cart item: missing product ID');
        }
        
        return {
          product_id: Number(productId),
          quantity: Number(item.quantity) || 1,
        };
      });

      console.log('Order items:', orderItems);

      // Place the order first
      const orderResponse = await placeOrderMutation.mutateAsync({
        items: orderItems,
        delivery_address: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postal_code: selectedAddress.zipCode,
          phone: user?.phone || '',
          additional_info: deliveryNotes || undefined,
        },
      });

      console.log('Order placed successfully:', orderResponse);

      // If card payment, initialize Paystack
      if (selectedPayment === 'card' && user?.email) {
        const paymentResponse = await initializePaymentMutation.mutateAsync({
          orderId: orderResponse.id,
          email: user.email,
        });

        setPaymentReference(paymentResponse.reference);
        setPaymentUrl(paymentResponse.authorization_url);
        setShowPaymentWebView(true);
      } else {
        // Cash on delivery - clear cart and navigate
        clearCartMutation.mutate();
        Alert.alert(
          "Order Placed Successfully!",
          "Your order has been confirmed. Pay on delivery.",
          [{ 
            text: "View Order", 
            onPress: () => router.replace(`/order/${orderResponse.id}`) 
          }]
        );
      }
    } catch (error: any) {
      console.error('Order placement error:', error);
      const errorMessage = error.response?.data?.error || error.message || "Failed to place order. Please try again.";
      Alert.alert("Order Error", errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentWebViewNav = async (navState: any) => {
    const { url } = navState;
    
    // Check if payment was successful (Paystack redirects to callback URL)
    if (url.includes('/payment/callback') || url.includes('success')) {
      setShowPaymentWebView(false);
      
      if (paymentReference) {
        try {
          await verifyPaymentMutation.mutateAsync(paymentReference);
          // Clear cart after successful payment
          clearCartMutation.mutate();
          Alert.alert(
            "Payment Successful!",
            "Your order has been confirmed.",
            [{ 
              text: "View Orders", 
              onPress: () => router.replace("/orders") 
            }]
          );
        } catch (error) {
          Alert.alert("Payment Verification Failed", "Please contact support.");
        }
      }
    } else if (url.includes('/payment/cancel') || url.includes('cancel')) {
      setShowPaymentWebView(false);
      Alert.alert("Payment Cancelled", "You cancelled the payment.");
    }
  };

  if (showPaymentWebView && paymentUrl) {
    // Open payment in browser instead of WebView
    Linking.openURL(paymentUrl);
    setShowPaymentWebView(false);
    
    return (
      <View className="flex-1 items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-600">Redirecting to payment...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <IconSymbol name="arrow.left" size={24} color="#000" />
        </Pressable>
        <Text className="text-xl font-bold">Checkout</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Order Summary */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-lg font-semibold mb-4">Order Summary</Text>
          <View className="mb-4">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="text-gray-900 font-medium">
                ₦{totals.subtotal.toFixed(0)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Delivery Fee</Text>
              <Text className="text-gray-900 font-medium">
                {formatCurrency(totals.deliveryFee)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Service Fee</Text>
              <Text className="text-gray-900 font-medium">
                ₦{totals.serviceFee.toFixed(0)}
              </Text>
            </View>
            <Separator className="my-3" />
            <View className="flex-row justify-between">
              <Text className="text-lg font-bold">Total</Text>
              <Text className="text-lg font-bold text-gray-900">
                {formatCurrency(totals.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Address */}
        <View className="bg-white p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold">Delivery Address</Text>
            <Pressable onPress={() => router.push("/addresses")}>
              <Text className="text-primary">Change</Text>
            </Pressable>
          </View>

          {selectedAddress ? (
            <View className="bg-gray-50 rounded-lg p-3">
              <View className="flex-row items-center mb-1">
                <IconSymbol name="location.fill" size={16} color="#666" />
                <Text className="ml-2 font-semibold capitalize">
                  {selectedAddress.label}
                </Text>
              </View>
              <Text className="text-gray-700">
                {selectedAddress.street}, {selectedAddress.city},{" "}
                {selectedAddress.state} {selectedAddress.zipCode}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/addresses")}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center"
            >
              <IconSymbol name="plus" size={24} color="#666" />
              <Text className="text-gray-600 mt-2">Add delivery address</Text>
            </Pressable>
          )}
        </View>

        {/* Payment Method */}
        <View className="bg-white p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold">Payment Method</Text>
            <Pressable onPress={() => router.push("/payments")}>
              <Text className="text-primary">Change</Text>
            </Pressable>
          </View>

          {selectedPayment ? (
            <View className="bg-gray-50 rounded-lg p-3">
              <View className="flex-row items-center">
                <IconSymbol name="creditcard.fill" size={16} color="#666" />
                <Text className="ml-2 font-semibold">
                  {selectedPayment === 'card' ? 'Card Payment' : 'Cash on Delivery'}
                </Text>
              </View>
              {selectedPayment === 'card' && (
                <Text className="text-xs text-gray-500">
                  Pay via Paystack
                </Text>
              )}
            </View>
          ) : (
            <Pressable
              onPress={() => router.push("/payments")}
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center"
            >
              <IconSymbol name="plus" size={24} color="#666" />
              <Text className="text-gray-600 mt-2">Add payment method</Text>
            </Pressable>
          )}
        </View>

        {/* Delivery Notes */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-lg font-semibold mb-3 text-gray-900">Delivery Notes</Text>
          <TextInput
            placeholder="Add special instructions for the delivery..."
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholderTextColor='#6b7280'
            style={{
              minHeight: 80,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 15,
              color: '#111827',
              backgroundColor: '#f9fafb',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#e5e7eb',
            }}
          />
        </View>

        {/* Estimated Delivery Time */}
        <View className="bg-white p-4 mb-6">
          <View className="flex-row items-center">
            <IconSymbol name="clock.fill" size={20} color="#15785B" />
            <View className="ml-3">
              <Text className="font-semibold">Estimated Delivery</Text>
              <Text className="text-gray-600">25-35 minutes</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Button */}
      <View className="bg-white p-4 border-t border-gray-200">
        {!selectedAddress && (
          <Text className="text-red-500 text-sm mb-2 text-center">
            Please add a delivery address to continue
          </Text>
        )}
        {cart.length === 0 && (
          <Text className="text-red-500 text-sm mb-2 text-center">
            Your cart is empty
          </Text>
        )}
        <Button
          onPress={handlePlaceOrder}
          disabled={!selectedAddress || !selectedPayment || isProcessing || cart.length === 0}
          className="w-full"
        >
          {isProcessing ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white">Processing...</Text>
            </View>
          ) : (
            <Text className="text-white">Place Order · {formatCurrency(totals.total)}</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
