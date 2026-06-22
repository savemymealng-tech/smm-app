import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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

import { api } from "@/lib/api";
import { addressesApi } from "@/lib/api/addresses";
import {
  useInitializePayment,
  usePlaceOrder,
  useVerifyPayment,
} from "@/lib/hooks";
import { useHybridCart, useHybridClearCart } from "@/lib/hooks/use-hybrid-cart";
import { useProfile } from "@/lib/hooks/use-profile";
import { formatCurrency, formatTime12Hour, getEffectivePickupDay } from "@/lib/utils";

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
        <Text className="ml-2 font-semibold capitalize">{address.type}</Text>
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
  method: "card" | null;
}) {
  if (!method) return null;

  return (
    <View className="bg-gray-50 rounded-lg p-3">
      <View className="flex-row items-center">
        <IconSymbol name="creditcard.fill" size={16} color="#666" />
        <Text className="ml-2 font-semibold">Online Payment</Text>
      </View>
      <Text className="text-xs text-gray-500 mt-1">Pay via Paystack</Text>
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
      {deliveryFee > 0 && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Delivery Fee</Text>
          <Text className="text-gray-900 font-medium">{formatCurrency(deliveryFee)}</Text>
        </View>
      )}
      {serviceFee > 0 && (
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Service Fee</Text>
          <Text className="text-gray-900 font-medium">{formatCurrency(serviceFee)}</Text>
        </View>
      )}
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

  // Check if cart has delivery or pickup items based on selected fulfillment method
  const hasDeliveryItems = useMemo(() => {
    return cart.some(item => 
      (item as any).fulfillment_method === 'delivery' || 
      (item.product?.available_for_delivery && !item.product?.available_for_pickup)
    );
  }, [cart]);

  const hasPickupItems = useMemo(() => {
    return cart.some(item => 
      (item as any).fulfillment_method === 'pickup' || 
      (item.product?.available_for_pickup && !item.product?.available_for_delivery)
    );
  }, [cart]);

  // Calculate estimated delivery/pickup times from cart
  const estimatedTimes = useMemo(() => {
    const deliveryItems = cart.filter(item => 
      (item as any).fulfillment_method === 'delivery' || 
      (item.product?.available_for_delivery && !item.product?.available_for_pickup)
    );
    const pickupItems = cart.filter(item => 
      (item as any).fulfillment_method === 'pickup' || 
      (item.product?.available_for_pickup && !item.product?.available_for_delivery)
    );

    const maxDeliveryTime = deliveryItems.reduce((max, item) => {
      const time = item.product?.delivery_time_minutes || 0;
      return time > max ? time : max;
    }, 0);

    // Get pickup time ranges from products
    const pickupTimeRanges = pickupItems
      .map(item => ({
        start: item.product?.pickup_start_time,
        end: item.product?.pickup_end_time,
        day: item.product?.pickup_day
      }))
      .filter(range => range.start && range.end);

    return { 
      delivery: maxDeliveryTime, 
      pickupTimeRanges,
      hasDelivery: deliveryItems.length > 0,
      hasPickup: pickupItems.length > 0
    };
  }, [cart]);

  // Fetch addresses from API
  const { data: addresses = [], isLoading: loadingAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.getAddresses(),
    staleTime: 30000,
  });

  const placeOrder = usePlaceOrder();
  const initializePayment = useInitializePayment();
  const verifyPayment = useVerifyPayment();

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<"card">("card");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const isAutoVerifyingRef = useRef(false);

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

  // Check if any items require fulfillment choice
  const hasItemsRequiringChoice = useMemo(() => {
    return cart.some(item => (item as any).requires_fulfillment_choice);
  }, [cart]);

  const canPlaceOrder = Boolean(
    ((hasDeliveryItems && selectedAddress) || !hasDeliveryItems) &&
    selectedPayment && 
    cart.length > 0 && 
    !isProcessing &&
    !hasItemsRequiringChoice
  );

  const prepareOrderItems = (cartItems: typeof cart) => {
    return cartItems.map((item) => {
      const productId =
        (item as { product_id?: string | number; productId?: string | number; product?: { id: string | number }; id?: string | number }).product_id
        ?? item.productId
        ?? item.product?.id
        ?? (item as { id?: string | number }).id;

      if (!productId) {
        throw new Error(`Cart item missing product ID: ${JSON.stringify(item)}`);
      }

      return {
        product_id: Number(productId),
        quantity: Number(item.quantity) || 1,
      };
    });
  };

  const getVerificationStatus = (result: any) => {
    const status = String(result?.status || '').toLowerCase();

    if (result?.success === true || status === 'success') return 'success';
    if (result?.failed === true || status === 'failed' || status === 'reversed') return 'failed';
    if (result?.pending === true || ['pending', 'ongoing', 'processing', 'queued'].includes(status)) return 'pending';
    if (status === 'abandoned' || result?.abandoned === true) return 'abandoned';

    return status || null;
  };

  const handlePlaceOrder = async () => {
    // Validate delivery items have a selected address
    // if (hasDeliveryItems && !selectedAddress) {
    //   toast.warning("Missing Information", "Please select a delivery address for your delivery items.");
    //   return;
    // }

    if (cart.length === 0) {
      toast.warning("Empty Cart", "Your cart is empty.");
      return;
    }

    if (hasItemsRequiringChoice) {
      toast.warning("Fulfillment Method Required", "Please select pickup or delivery for all items in your cart.");
      return;
    }

    setIsProcessing(true);

    try {
      // Prepare order payload - ensure address_id is sent when there are delivery items
      const orderPayload = {
        use_cart: true,
        items: [], // Server uses cart when use_cart is true
        address_id: hasDeliveryItems && selectedAddress ? Number(selectedAddress.id) : undefined,
        recipient_name: user?.full_name || user?.name || undefined,
        special_instructions: deliveryNotes || undefined,
        payment_method: "card" as const,
      };

      // Log for debugging - ensure address is included for delivery orders
      console.log('🛒 Placing order:', {
        hasDeliveryItems,
        hasPickupItems,
        address_id: orderPayload.address_id,
        cart_items: cart.length,
      });

      const orderResponse = await placeOrder.mutateAsync(orderPayload);
      const response = orderResponse as any;

      // Support multiple backend response shapes:
      // 1) { orders, payment, error }
      // 2) { order, payment, error }
      // 3) single Order object with nested payment
      const ordersSource = response?.orders ?? response?.order ?? response;
      const ordersList = Array.isArray(ordersSource)
        ? ordersSource
        : ordersSource && (ordersSource.id || ordersSource.order_group_id)
          ? [ordersSource]
          : [];

      const firstOrder = ordersList[0];
      const getPaymentValues = (source: any) => {
        const payment = source?.payment ?? source?.data?.payment ?? firstOrder?.payment;
        const authorizationUrl =
          payment?.authorization_url ??
          payment?.authorizationUrl ??
          payment?.checkout_url ??
          payment?.checkoutUrl ??
          payment?.data?.authorization_url ??
          source?.authorization_url ??
          source?.data?.authorization_url;

        const reference =
          payment?.reference ??
          payment?.data?.reference ??
          firstOrder?.payment?.reference;

        const referenceFromUrl = (() => {
          if (!authorizationUrl) return null;
          try {
            const parsed = new URL(authorizationUrl);
            return parsed.searchParams.get("reference") || parsed.searchParams.get("trxref");
          } catch {
            return null;
          }
        })();

        return {
          authorizationUrl,
          resolvedReference: reference || referenceFromUrl,
        };
      };

      let { authorizationUrl, resolvedReference } = getPaymentValues(response);

      // If place-order response doesn't include payment link, initialize payment explicitly.
      if (!authorizationUrl && firstOrder) {
        const customerEmail =
          user?.email ??
          (firstOrder as any)?.Customer?.email;

        if (customerEmail) {
          try {
            const initializedPayment = await initializePayment.mutateAsync(
              firstOrder?.order_group_id
                ? {
                    orderGroupId: firstOrder.order_group_id,
                    email: customerEmail,
                    callbackUrl: "savemymeal://payment/callback",
                  }
                : {
                    orderId: firstOrder.id,
                    email: customerEmail,
                    callbackUrl: "savemymeal://payment/callback",
                  }
            );

            const values = getPaymentValues(initializedPayment);
            authorizationUrl = values.authorizationUrl;
            resolvedReference = values.resolvedReference;
          } catch (initError) {
            console.error("Payment initialization after checkout failed:", initError);
          }
        }
      }

      // If we have a payment link but no reference, explicitly initialize again
      // to retrieve a usable Paystack reference for verification/auto-close.
      if (authorizationUrl && !resolvedReference && firstOrder) {
        const customerEmail =
          user?.email ??
          (firstOrder as any)?.Customer?.email;

        if (customerEmail) {
          try {
            const initializedPayment = await initializePayment.mutateAsync(
              firstOrder?.order_group_id
                ? {
                    orderGroupId: firstOrder.order_group_id,
                    email: customerEmail,
                    callbackUrl: "savemymeal://payment/callback",
                  }
                : {
                    orderId: firstOrder.id,
                    email: customerEmail,
                    callbackUrl: "savemymeal://payment/callback",
                  }
            );

            const values = getPaymentValues(initializedPayment);
            authorizationUrl = values.authorizationUrl;
            resolvedReference = values.resolvedReference;
          } catch (initError) {
            console.error("Payment reference recovery failed:", initError);
          }
        }
      }

      // Open Paystack only when we have both authorization URL and reference.
      if (authorizationUrl && resolvedReference) {
        setPaymentReference(resolvedReference);
        setPaymentUrl(authorizationUrl);
        setShowPaymentWebView(true);

        // Store order info for success handling
        if (ordersList.length > 1 && firstOrder?.order_group_id) {
          setSuccessOrderId(firstOrder.order_group_id as any);
        } else if (firstOrder?.id) {
          setSuccessOrderId(firstOrder.id);
        }
      } else {
        // Payment initialization failed but order was created
        clearCart.mutate();
        toast.warning(
          "Payment Initialization Failed",
          response?.error || "Order created but payment could not be initialized. You can pay later from your orders."
        );
        // Navigate to orders page
        router.replace("/orders");
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
      const verification = await verifyPayment.mutateAsync(reference);

      if (getVerificationStatus(verification) !== 'success') {
        throw new Error('Payment verification did not return success');
      }

      clearCart.mutate();
      setPaymentUrl(null);
      setPaymentReference(null);
      setSuccessMessage("Payment successful! Your order has been confirmed.");
      setSuccessDialogOpen(true);
    } catch (err) {
      console.error("Payment verification failed:", err);
      toast.error(
        "Payment Verification Failed",
        "Unable to confirm your payment. Please try again or contact support."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentCancel = async () => {
    setShowPaymentWebView(false);

    // Callback URL may not be configured on gateway side.
    // Verify with known reference before marking this as cancelled.
    if (paymentReference) {
      setIsProcessing(true);
      try {
        const verification = await api.payments.verifyPayment(paymentReference);
        const status = getVerificationStatus(verification);

        if (status === "success") {
          clearCart.mutate();
          setPaymentUrl(null);
          setPaymentReference(null);
          setSuccessMessage("Payment successful! Your order has been confirmed.");
          setSuccessDialogOpen(true);
          return;
        }

        if (status === 'failed' || status === 'reversed') {
          setPaymentUrl(null);
          setPaymentReference(null);
          toast.error("Payment Failed", "Your payment failed. Please try again.");
          return;
        }

        if (status === 'abandoned') {
          setPaymentUrl(null);
          setPaymentReference(null);
          toast.warning("Payment Cancelled", "You cancelled the payment.");
          return;
        }

        if (status === 'pending') {
          toast.warning("Payment Pending", "Your payment is still being confirmed.");
          return;
        }
      } catch (err) {
        console.log("Payment not verified on cancel/close:", err);
      } finally {
        setIsProcessing(false);
      }
    }

    setPaymentUrl(null);
    setPaymentReference(null);
    toast.warning("Payment Cancelled", "You cancelled the payment.");
  };

  const handlePaymentClose = () => {
    void handlePaymentCancel();
  };

  useEffect(() => {
    if (!showPaymentWebView) return;
    if (!paymentReference) return;

    let stopped = false;
    let attempts = 0;
    const maxAttempts = 40;

    const interval = setInterval(() => {
      if (stopped || isAutoVerifyingRef.current) return;

      attempts += 1;
      isAutoVerifyingRef.current = true;

      void api.payments
        .verifyPayment(paymentReference)
        .then((verification) => {
          if (stopped) return;

          if (getVerificationStatus(verification) === "success") {
            stopped = true;
            clearInterval(interval);
            setShowPaymentWebView(false);
            setPaymentUrl(null);
            setPaymentReference(null);
            clearCart.mutate();
            setSuccessMessage("Payment successful! Your order has been confirmed.");
            setSuccessDialogOpen(true);
          }
        })
        .catch(() => {
          // Ignore transient verification failures while payment is in progress.
        })
        .finally(() => {
          isAutoVerifyingRef.current = false;
          if (attempts >= maxAttempts) {
            stopped = true;
            clearInterval(interval);
          }
        });
    }, 3000);

    return () => {
      stopped = true;
      clearInterval(interval);
      isAutoVerifyingRef.current = false;
    };
  }, [showPaymentWebView, paymentReference, clearCart]);

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



        {/* Pickup Information */}
        {hasPickupItems && (
          <View className="bg-white p-4 mb-4">
            <SectionHeader title="Pickup Information" />
            <View className="flex-row items-start mt-2">
              <IconSymbol name="bag.fill" size={20} color="#1E8449" />
              <View className="flex-1 ml-3">
                <Text className="text-gray-900 font-semibold mb-1">
                  {hasDeliveryItems ? 'Some items will be ready for pickup' : 'Items will be ready for pickup'}
                </Text>
                <Text className="text-gray-600 text-sm">
                  Please collect these items directly from the vendor after placing your order.
                  You will receive pickup details in your order confirmation.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Method */}
        <View className="bg-white p-4 mb-4">
          <SectionHeader
            title="Payment Method"
          />
          <PaymentMethodDisplay method={selectedPayment} />
          <Text className="text-xs text-gray-500 mt-2">Choose from the payment methods available at checkout</Text>
        </View>

        {/* Special Instructions */}
        <View className="bg-white p-4 mb-4">
          <SectionHeader title="Special Instructions" />
          <TextInput
            placeholder="Special instructions for your order (optional)..."
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#9ca3af"
            className="min-h-[100px] rounded-xl bg-gray-50 px-4 py-3 text-base border border-gray-200 text-gray-900"
          />
        </View>

        {/* Estimated Pickup Times */}
        {estimatedTimes.hasPickup && estimatedTimes.pickupTimeRanges.length > 0 && (
          <View className="bg-white p-4 mb-6">
            <View className="flex-row items-start">
              <IconSymbol name="bag.fill" size={20} color="#1E8449" />
              <View className="ml-3 flex-1">
                <Text className="font-semibold mb-1">Pickup Times</Text>
                {estimatedTimes.pickupTimeRanges.map((range, index) => (
                  <Text key={index} className="text-gray-600">
                    {getEffectivePickupDay(range.day, range.end)}: {formatTime12Hour(range.start)} - {formatTime12Hour(range.end)}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Extra space at bottom (helps when keyboard opens) */}
        <View className="h-20" />
      </ScrollView>

      {/* Floating Place Order Button */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
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
                          {address.type}
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
                router.replace("/orders");
              }}
            >
              <Text>View Order</Text>
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