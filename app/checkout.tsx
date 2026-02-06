import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { PaystackWebView } from "@/components/ui/paystack-webview";
import { Text } from "@/components/ui/text";
import { toast } from "@/components/ui/toast";

import { addressesApi } from "@/lib/api/addresses";
import {
    usePlaceOrder,
    useVerifyPayment,
} from "@/lib/hooks";
import { useHybridCart, useHybridClearCart } from "@/lib/hooks/use-hybrid-cart";
import { useProfile } from "@/lib/hooks/use-profile";
import { formatCurrency } from "@/lib/utils";

import type { Address } from "../types";

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────

interface CartItem {
  id?: string | number;
  product_id?: string | number;
  productId?: string | number;
  product?: { id: string | number };
  quantity: number;
}

interface OrderDeliveryAddress {
  recipient_name: string;
  phone: string;
  street: string;
  city: string;
  state: {
    id: number;
    name: string;
  };
  country: {
    id: number;
    name: string;
  };
  postal_code?: string;
  additional_info?: string;
  latitude?: number;
  longitude?: number;
}

// ────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────

function SectionHeader({
  title,
  actionText,
  onAction,
}: {
  title: string;
  actionText?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-lg font-semibold text-gray-900">{title}</Text>
      {actionText && onAction && (
        <Pressable onPress={onAction}>
          <Text className="text-primary">{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
}

function AddressDisplay({ address }: { address: Address }) {
  return (
    <View className="bg-gray-50 rounded-lg p-3">
      <View className="flex-row items-center mb-1">
        <IconSymbol name="location.fill" size={16} color="#666" />
        <Text className="ml-2 font-semibold capitalize">{address.label}</Text>
      </View>
      <Text className="text-gray-700">
        {address.street}, {address.city}, {address.state?.name || ''} {address.zipCode}
      </Text>
    </View>
  );
}

function PaymentMethodDisplay({
  method,
}: {
  method: "card" | "cash" | null;
}) {
  if (!method) return null;

  return (
    <View className="bg-gray-50 rounded-lg p-3">
      <View className="flex-row items-center">
        <IconSymbol name="creditcard.fill" size={16} color="#666" />
        <Text className="ml-2 font-semibold">
          {method === "card" ? "Card Payment" : "Cash on Delivery"}
        </Text>
      </View>
      {method === "card" && (
        <Text className="text-xs text-gray-500 mt-1">Pay via Paystack</Text>
      )}
    </View>
  );
}

function TotalsDisplay({
  subtotal,
  deliveryFee,
  serviceFee,
  tax,
  total,
}: {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  total: number;
}) {
  return (
    <View className="mb-4">
      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">Subtotal</Text>
        <Text className="text-gray-900 font-medium">{formatCurrency(subtotal)}</Text>
      </View>
      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">Delivery Fee</Text>
        <Text className="text-gray-900 font-medium">{formatCurrency(deliveryFee)}</Text>
      </View>
      <View className="flex-row justify-between mb-2">
        <Text className="text-gray-600">Service Fee</Text>
        <Text className="text-gray-900 font-medium">{formatCurrency(serviceFee)}</Text>
      </View>
      <View className="border-t border-gray-200 my-3" />
      <View className="flex-row justify-between">
        <Text className="text-lg font-bold text-gray-900">Total</Text>
        <Text className="text-lg font-bold text-gray-900">{formatCurrency(total)}</Text>
      </View>
    </View>
  );
}

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { cart, subtotal, deliveryFee, serviceFee, tax } = useHybridCart();
  const { data: user } = useProfile();
  const clearCart = useHybridClearCart();

  // Fetch addresses from API
  const { data: addresses = [], isLoading: loadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.getAddresses(),
    staleTime: 30000,
  });

  const placeOrder = usePlaceOrder();
  const verifyPayment = useVerifyPayment();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"card" | "cash">("card");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Auto-select default address
  useEffect(() => {
    if (selectedAddress) return;
    if (!addresses?.length) return;

    const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
    setSelectedAddress(defaultAddr);
  }, [addresses, selectedAddress]);

  const total = useMemo(
    () => subtotal + deliveryFee + serviceFee + tax,
    [subtotal, deliveryFee, serviceFee, tax]
  );

  const canPlaceOrder = Boolean(
    selectedAddress && selectedPayment && cart.length > 0 && !isProcessing
  );

  const prepareOrderItems = (cartItems: typeof cart) => {
    return cartItems.map((item) => {
      const productId =
        item.product_id ?? item.productId ?? item.product?.id ?? item.id;

      if (!productId) {
        throw new Error(`Cart item missing product ID: ${JSON.stringify(item)}`);
      }

      return {
        product_id: Number(productId),
        quantity: Number(item.quantity) || 1,
      };
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.warning("Missing Information", "Please select a delivery address.");
      return;
    }
    
    // Validate address has required state and country data
    if (!selectedAddress.stateId || !selectedAddress.state?.name) {
      toast.error("Invalid Address", "Selected address is missing state information. Please update the address.");
      return;
    }
    
    if (!selectedAddress.countryId || !selectedAddress.country?.name) {
      toast.error("Invalid Address", "Selected address is missing country information. Please update the address.");
      return;
    }
    
    if (cart.length === 0) {
      toast.warning("Empty Cart", "Your cart is empty.");
      return;
    }

    setIsProcessing(true);

    try {
      const orderItems = prepareOrderItems(cart);

      // Prepare delivery address with proper validation
      const deliveryAddress: any = {
        recipient_name: user?.full_name || user?.name || "Customer",
        phone: user?.phone || "",
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: {
          id: selectedAddress.stateId,
          name: selectedAddress.state.name
        },
        country: {
          id: selectedAddress.countryId,
          name: selectedAddress.country.name
        },
      };

      // Only add optional fields if they have valid values
      if (selectedAddress.zipCode) {
        deliveryAddress.postal_code = selectedAddress.zipCode;
      }
      
      if (deliveryNotes) {
        deliveryAddress.additional_info = deliveryNotes;
      }
      
      // Only include coordinates if they are valid numbers
      if (typeof selectedAddress.latitude === 'number' && !isNaN(selectedAddress.latitude)) {
        deliveryAddress.latitude = selectedAddress.latitude;
      }
      
      if (typeof selectedAddress.longitude === 'number' && !isNaN(selectedAddress.longitude)) {
        deliveryAddress.longitude = selectedAddress.longitude;
      }

      const orderResponse = await placeOrder.mutateAsync({
        items: orderItems,
        delivery_address: deliveryAddress,
        special_instructions: deliveryNotes || undefined,
        payment_method: selectedPayment === "card" ? "card" : "cash_on_delivery",
      });

      // New backend returns { orders, payment, error } structure
      const { orders, payment, error } = orderResponse as any;
      
      // Handle both single order and multiple vendor orders
      const ordersList = Array.isArray(orders) ? orders : [orders];
      const firstOrder = ordersList[0];
      
      if (selectedPayment === "card") {
        // For card payment, check if payment was automatically initialized
        if (payment && payment.authorization_url) {
          // Payment was successfully initialized
          setPaymentReference(payment.reference);
          setPaymentUrl(payment.authorization_url);
          setShowPaymentWebView(true);
          
          // Store order info for success handling
          if (ordersList.length > 1) {
            setSuccessOrderId(firstOrder.order_group_id as any);
          } else {
            setSuccessOrderId(firstOrder.id);
          }
        } else {
          // Payment initialization failed but order was created
          clearCart.mutate();
          toast.warning(
            "Payment Initialization Failed",
            error || "Order created but payment could not be initialized. You can pay later from your orders."
          );
          // Navigate to orders page
          router.replace("/orders");
        }
      } else {
        // Cash on delivery - no payment needed
        clearCart.mutate();
        if (ordersList.length > 1) {
          setSuccessOrderId(firstOrder.order_group_id as any);
          setSuccessMessage(`Your orders have been confirmed across ${ordersList.length} vendors. Pay on delivery.`);
        } else {
          setSuccessOrderId(firstOrder.id);
          setSuccessMessage("Your order has been confirmed. Pay on delivery.");
        }
        setSuccessDialogOpen(true);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ??
        err.message ??
        "Failed to place order. Please try again.";
      toast.error("Order Failed", msg);
      console.error("Order placement failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    setShowPaymentWebView(false);
    setIsProcessing(true);

    try {
      await verifyPayment.mutateAsync(reference);
      clearCart.mutate();
      setSuccessMessage("Payment successful! Your order has been confirmed.");
      setSuccessDialogOpen(true);
    } catch (err) {
      console.error("Payment verification failed:", err);
      toast.error(
        "Verification Issue",
        "Payment may have been received. Please contact support."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    setPaymentReference(null);
    toast.warning("Payment Cancelled", "You cancelled the payment.");
  };

  const handlePaymentClose = () => {
    setShowPaymentWebView(false);
    setPaymentUrl(null);
    setPaymentReference(null);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header - fixed at top */}
      <View className="bg-white border-b border-gray-200 px-4 py-4 mt-12 flex-row items-center">
        <Pressable onPress={() => router.back()} className="mr-3">
          <IconSymbol name="arrow.left" size={24} color="#000" />
        </Pressable>
        <Text className="text-xl font-bold">Checkout</Text>
      </View>

      {/* Scrollable content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 180, // safe space for bottom button
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Order Summary */}
        <View className="bg-white p-4 mb-4">
          <SectionHeader title="Order Summary" />
          <TotalsDisplay
            subtotal={subtotal}
            deliveryFee={deliveryFee}
            serviceFee={serviceFee}
            tax={tax}
            total={total}
          />
        </View>

        {/* Delivery Address */}
        <View className="bg-white p-4 mb-4">
          <SectionHeader
            title="Delivery Address"
            actionText={addresses?.length ? "Change" : "Add"}
            onAction={() => {
              if (addresses?.length) {
                setShowAddressSelector(true);
              } else {
                router.push("/addresses");
              }
            }}
          />
          {selectedAddress ? (
            <AddressDisplay address={selectedAddress} />
          ) : (
            <Pressable
              onPress={() => {
                if (addresses?.length) {
                  setShowAddressSelector(true);
                } else {
                  router.push("/addresses");
                }
              }}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 items-center"
            >
              <IconSymbol name="plus" size={32} color="#888" />
              <Text className="text-gray-600 mt-3 font-medium">
                {addresses?.length ? "Select delivery address" : "Add delivery address"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Payment Method */}
        <View className="bg-white p-4 mb-4">
          <SectionHeader
            title="Payment Method"
            actionText="Change"
            onAction={() => setShowPaymentSelector(true)}
          />
          <PaymentMethodDisplay method={selectedPayment} />
        </View>

        {/* Delivery Notes */}
        <View className="bg-white p-4 mb-4">
          <SectionHeader title="Delivery Notes" />
          <TextInput
            placeholder="Special instructions for delivery (optional)..."
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
            className="min-h-[100px] rounded-xl bg-gray-50 px-4 py-3 text-base border border-gray-200 text-gray-900"
          />
        </View>

        {/* Estimated Delivery */}
        <View className="bg-white p-4 mb-6">
          <View className="flex-row items-center">
            <IconSymbol name="clock.fill" size={20} color="#15785B" />
            <View className="ml-3">
              <Text className="font-semibold">Estimated Delivery</Text>
              <Text className="text-gray-600">25–40 minutes</Text>
            </View>
          </View>
        </View>

        {/* Extra space at bottom (helps when keyboard opens) */}
        <View className="h-20" />
      </ScrollView>

      {/* Floating Place Order Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {!selectedAddress && (
          <Text className="text-red-600 text-sm mb-3 text-center">
            Please select a delivery address
          </Text>
        )}
        {cart.length === 0 && (
          <Text className="text-red-600 text-sm mb-3 text-center">
            Cart is empty
          </Text>
        )}

        <Button
          onPress={handlePlaceOrder}
          disabled={!canPlaceOrder}
          className="w-full"
        >
          {isProcessing ? (
            <View className="flex-row items-center justify-center gap-2">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-medium">Processing…</Text>
            </View>
          ) : (
            <Text className="text-white font-medium">
              Place Order • {formatCurrency(total)}
            </Text>
          )}
        </Button>
      </View>

      {/* Address Selector Bottom Sheet */}
      <BottomSheet
        visible={showAddressSelector}
        onClose={() => setShowAddressSelector(false)}
        title="Select Delivery Address"
      >
        <View className="flex-1 px-6 pb-6">
          {loadingAddresses ? (
            <View className="flex-1 items-center justify-center py-12">
              <ActivityIndicator size="large" color="#15785B" />
              <Text className="text-gray-500 mt-3">Loading addresses...</Text>
            </View>
          ) : (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {addresses?.map((address) => (
              <Pressable
                key={address.id}
                onPress={() => {
                  setSelectedAddress(address);
                  setShowAddressSelector(false);
                }}
                className="mb-3"
              >
                <View
                  className={`rounded-xl p-4 border-2 ${
                    selectedAddress?.id === address.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <IconSymbol
                        name={address.type === 'home' ? 'house' : address.type === 'work' ? 'briefcase' : 'location'}
                        size={20}
                        color={selectedAddress?.id === address.id ? "#15785B" : "#666"}
                      />
                      <Text
                        className={`ml-2 font-semibold capitalize ${
                          selectedAddress?.id === address.id ? "text-primary" : "text-gray-900"
                        }`}
                      >
                        {address.label}
                      </Text>
                      {address.isDefault && (
                        <View className="ml-2 bg-green-100 px-2 py-0.5 rounded-full">
                          <Text className="text-green-800 text-xs font-medium">Default</Text>
                        </View>
                      )}
                    </View>
                    {selectedAddress?.id === address.id && (
                      <IconSymbol name="checkmark.circle.fill" size={24} color="#15785B" />
                    )}
                  </View>
                  <Text className="text-gray-600 text-sm">
                    {address.street}, {address.city}, {address.state?.name || ''} {address.zipCode}
                  </Text>
                  {address.country && (
                    <Text className="text-gray-500 text-xs mt-1">{address.country.name}</Text>
                  )}
                </View>
              </Pressable>
            ))}
            
            <Pressable
              onPress={() => {
                setShowAddressSelector(false);
                router.push("/addresses");
              }}
              className="border-2 border-dashed border-primary rounded-xl p-6 items-center mt-2"
            >
              <IconSymbol name="plus" size={28} color="#15785B" />
              <Text className="text-primary mt-2 font-medium">
                Add New Address
              </Text>
            </Pressable>
          </ScrollView>
          )}
        </View>
      </BottomSheet>

      {/* Payment Method Selector Bottom Sheet */}
      <BottomSheet
        visible={showPaymentSelector}
        onClose={() => setShowPaymentSelector(false)}
        title="Select Payment Method"
      >
        <View className="flex-1 px-6 pb-6">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Card Payment Option */}
            <Pressable
              onPress={() => {
                setSelectedPayment("card");
                setShowPaymentSelector(false);
              }}
              className="mb-3"
            >
              <View
                className={`rounded-xl p-4 border-2 ${
                  selectedPayment === "card"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${
                      selectedPayment === "card" ? "bg-primary/10" : "bg-gray-100"
                    }`}>
                      <IconSymbol
                        name="creditcard.fill"
                        size={24}
                        color={selectedPayment === "card" ? "#15785B" : "#666"}
                      />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        className={`font-semibold text-base ${
                          selectedPayment === "card" ? "text-primary" : "text-gray-900"
                        }`}
                      >
                        Card Payment
                      </Text>
                      <Text className="text-gray-500 text-sm">Pay securely via Paystack</Text>
                    </View>
                  </View>
                  {selectedPayment === "card" && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color="#15785B" />
                  )}
                </View>
              </View>
            </Pressable>

            {/* Cash on Delivery Option */}
            <Pressable
              onPress={() => {
                setSelectedPayment("cash");
                setShowPaymentSelector(false);
              }}
              className="mb-3"
            >
              <View
                className={`rounded-xl p-4 border-2 ${
                  selectedPayment === "cash"
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 bg-white"
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${
                      selectedPayment === "cash" ? "bg-primary/10" : "bg-gray-100"
                    }`}>
                      <IconSymbol
                        name="banknote"
                        size={24}
                        color={selectedPayment === "cash" ? "#15785B" : "#666"}
                      />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text
                        className={`font-semibold text-base ${
                          selectedPayment === "cash" ? "text-primary" : "text-gray-900"
                        }`}
                      >
                        Cash on Delivery
                      </Text>
                      <Text className="text-gray-500 text-sm">Pay when you receive your order</Text>
                    </View>
                  </View>
                  {selectedPayment === "cash" && (
                    <IconSymbol name="checkmark.circle.fill" size={24} color="#15785B" />
                  )}
                </View>
              </View>
            </Pressable>
          </ScrollView>
        </View>
      </BottomSheet>

      {/* Success Dialog */}
      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Order Confirmed!</AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onPress={() => {
                setSuccessDialogOpen(false);
                if (successOrderId) {
                  // Check if it's an order group ID (starts with OG-)
                  const orderIdStr = String(successOrderId);
                  if (orderIdStr.startsWith('OG-')) {
                    // Navigate to orders list for now, or implement group view
                    router.replace("/orders");
                  } else {
                    router.replace(`/order/${successOrderId}`);
                  }
                } else {
                  router.replace("/orders");
                }
              }}
            >
              View Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Paystack WebView */}
      {paymentUrl && paymentReference && (
        <PaystackWebView
          visible={showPaymentWebView}
          authorizationUrl={paymentUrl}
          reference={paymentReference}
          onClose={handlePaymentClose}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCancel={handlePaymentCancel}
        />
      )}
    </View>
  );
}