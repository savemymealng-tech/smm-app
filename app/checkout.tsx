import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useCart } from "@/lib/hooks/use-cart";
import { useProfile } from "@/lib/hooks/use-profile";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "@rn-primitives/context-menu";
import type { Address, PaymentMethod } from "../types";

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart, getCartTotals, clearCart } = useCart();
  const { data: user } = useProfile();
  const totals = getCartTotals();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(
    user?.addresses?.find((a) => a.isDefault) || null
  );
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(
    user?.paymentMethods?.find((p) => p.isDefault) || null
  );
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePlaceOrder = async () => {
    if (!selectedAddress || !selectedPayment) {
      Alert.alert(
        "Missing Information",
        "Please select a delivery address and payment method."
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate order placement
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearCart();
      Alert.alert(
        "Order Placed Successfully!",
        "Your order has been confirmed and is being prepared.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/profile") }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const mockAddresses: Address[] = user?.addresses || [
    {
      id: "1",
      type: "home",
      label: "Home",
      street: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94102",
      country: "USA",
      isDefault: true,
    },
    {
      id: "2",
      type: "work",
      label: "Office",
      street: "456 Business Ave",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "USA",
    },
  ];

  const mockPaymentMethods: PaymentMethod[] = user?.paymentMethods || [
    {
      id: "1",
      type: "card",
      brand: "visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: "2",
      type: "apple_pay",
    },
  ];

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
                {formatCurrency(totals.subtotal)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Delivery Fee</Text>
              <Text className="text-gray-900 font-medium">
                {formatCurrency(totals.deliveryFee)}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Tax</Text>
              <Text className="text-gray-900 font-medium">
                {formatCurrency(totals.tax)}
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
                  {selectedPayment.type === "apple_pay"
                    ? "Apple Pay"
                    : selectedPayment.type === "google_pay"
                    ? "Google Pay"
                    : `???? ???? ???? ${selectedPayment.last4}`}
                </Text>
              </View>
              {selectedPayment.brand && (
                <Text className="text-gray-600 capitalize ml-6">
                  {selectedPayment.brand}
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
          <Text className="text-lg font-semibold mb-3">Delivery Notes</Text>
          <Input
            placeholder="Add special instructions for the delivery..."
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            variant="bordered"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
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
        <Button
          onPress={handlePlaceOrder}
          disabled={!selectedAddress || !selectedPayment || isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <Text>Processing...</Text>
          ) : (
            <Text>Place Order ? {formatCurrency(totals.total)}</Text>
          )}
        </Button>
      </View>
    </View>
  );
}
