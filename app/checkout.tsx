import { formatMoney as formatCurrency } from '@/lib/order-display';
import { useProtectedRoute } from '@/lib/hooks/use-protected-route';
import {
  Screen,
  PageScroll,
  Card,
  Action,
  AmountRow,
  ui,
  palette,
} from '@/components/ui/screen-kit';
import { AppImage } from '@/components/ui/app-image';
import { rateLimitWaitMs } from '@/lib/api/rate-limit';
import { OutcomeDialog } from '@/components/ui/outcome-dialog';
import { growthApi } from '@/lib/api/growth';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';

import { PaystackWebView } from '@/components/ui/paystack-webview';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';

import { api } from '@/lib/api';

import { usePlaceOrder, useVerifyPayment } from '@/lib/hooks';
import { useHybridCart, useHybridClearCart } from '@/lib/hooks/use-hybrid-cart';
import { useProfile } from '@/lib/hooks/use-profile';
import {
  formatTime12Hour,
  getEffectivePickupDay,
  getImageSource,
} from '@/lib/utils';

export default function CheckoutScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useProtectedRoute();

  const { cart, subtotal, deliveryFee, serviceFee, tax } = useHybridCart();
  const { data: user } = useProfile();
  const clearCart = useHybridClearCart();

  const hasDeliveryItems = cart.some(
    (item) =>
      item.fulfillment_method === 'delivery' ||
      item.product?.available_for_pickup === false,
  );
  const vendorGroups = useMemo(() => {
    const groups = new Map<string, typeof cart>();
    for (const item of cart) {
      const key = item.vendorId || 'unknown';
      groups.set(key, [...(groups.get(key) || []), item]);
    }
    return [...groups.entries()];
  }, [cart]);
  const [offersOpen, setOffersOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const placeOrder = usePlaceOrder();
  const verifyPayment = useVerifyPayment();

  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentWebView, setShowPaymentWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const isAutoVerifyingRef = useRef(false);

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [paymentOutcome, setPaymentOutcome] = useState<{
    kind: 'pending' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const showPaymentStatus = (
    kind: 'pending' | 'error',
    title: string,
    message: string,
  ) => setPaymentOutcome({ kind, title, message });

  const legacyTotal = useMemo(
    () => subtotal + deliveryFee + serviceFee + tax,
    [subtotal, deliveryFee, serviceFee, tax],
  );

  const [offerCode, setOfferCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [coinInput, setCoinInput] = useState('0');
  const [appliedCoins, setAppliedCoins] = useState(0);
  const requestKey = useRef(
    `checkout-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
  );
  const growthConfig = useQuery({
    queryKey: ['growth-config'],
    queryFn: growthApi.config,
    enabled: isAuthenticated,
  });
  const cartSignature = JSON.stringify(
    cart.map((item) => ({
      id: item.productId,
      quantity: item.quantity,
      fulfillment: item.fulfillment_method,
    })),
  );
  useEffect(() => {
    requestKey.current = `checkout-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }, [cartSignature, appliedCode, appliedCoins]);
  const quoteQuery = useQuery({
    queryKey: ['checkout-quote', cartSignature, appliedCode, appliedCoins],
    queryFn: () =>
      growthApi.quote({
        use_cart: true,
        campaign_code: appliedCode || undefined,
        coins: appliedCoins,
      }),
    enabled: Boolean(
      isAuthenticated && growthConfig.data?.enabled && cart.length,
    ),
    retry: false,
    refetchInterval: 60000,
  });
  const rewards = useQuery({
    queryKey: ['rewards'],
    queryFn: growthApi.rewards,
    enabled: Boolean(isAuthenticated && growthConfig.data?.coins_enabled),
  });
  const serverQuote = growthConfig.data?.enabled ? quoteQuery.data : undefined;
  const total = serverQuote ? serverQuote.payable_kobo / 100 : legacyTotal;
  const quoteNotReady = Boolean(
    growthConfig.isLoading ||
      growthConfig.isError ||
      (growthConfig.data?.enabled &&
        (quoteQuery.isFetching || quoteQuery.isError || !serverQuote)),
  );

  // Check if any items require fulfillment choice
  const hasItemsRequiringChoice = useMemo(() => {
    return cart.some((item) => (item as any).requires_fulfillment_choice);
  }, [cart]);

  const canPlaceOrder = Boolean(
    !hasDeliveryItems &&
      cart.length > 0 &&
      !isProcessing &&
      !hasItemsRequiringChoice,
  );

  const getVerificationStatus = (result: any) => {
    const status = String(result?.status || '').toLowerCase();

    if (result?.success === true || status === 'success') return 'success';
    if (result?.failed === true || status === 'failed' || status === 'reversed')
      return 'failed';
    if (
      result?.pending === true ||
      ['pending', 'ongoing', 'processing', 'queued'].includes(status)
    )
      return 'pending';
    if (status === 'abandoned' || result?.abandoned === true)
      return 'abandoned';

    return status || null;
  };

  const handlePlaceOrder = async () => {
    if (hasDeliveryItems) {
      toast.warning(
        'Pickup only',
        'Remove delivery items from your cart and add them again for pickup.',
      );
      return;
    }

    if (cart.length === 0) {
      toast.warning('Empty Cart', 'Your cart is empty.');
      return;
    }

    if (hasItemsRequiringChoice) {
      toast.warning(
        'Fulfillment Method Required',
        'Please select pickup or delivery for all items in your cart.',
      );
      return;
    }

    if (quoteNotReady) {
      toast.warning(
        'Refresh checkout',
        'Wait for your final price before placing this order.',
      );
      return;
    }
    setIsProcessing(true);

    try {
      // Prepare order payload - ensure address_id is sent when there are delivery items
      const orderPayload = {
        use_cart: true,
        items: [], // Server uses cart when use_cart is true

        recipient_name: user?.full_name || user?.name || undefined,
        special_instructions: deliveryNotes || undefined,
        payment_method: 'card' as const,
        ...(growthConfig.data?.enabled
          ? {
              campaign_code: appliedCode || undefined,
              coins: appliedCoins,
              quote_token: serverQuote?.quote_token,
              request_key: requestKey.current,
            }
          : {}),
      };

      const orderResponse = await placeOrder.mutateAsync(orderPayload);
      const response = orderResponse as any;

      // Support multiple backend response shapes:
      // 1) { orders, payment, error }
      // 2) { order, payment, error }
      // 3) single Order object with nested payment
      if (response?.paid === true) {
        clearCart.mutate();
        setSuccessMessage(
          'Your order is confirmed. Your offer and SMM Coin covered the amount due.',
        );
        setSuccessDialogOpen(true);
        return;
      }
      const ordersSource = response?.orders ?? response?.order ?? response;
      const ordersList = Array.isArray(ordersSource)
        ? ordersSource
        : ordersSource && (ordersSource.id || ordersSource.order_group_id)
          ? [ordersSource]
          : [];

      const firstOrder = ordersList[0];
      const getPaymentValues = (source: any) => {
        const payment =
          source?.payment ?? source?.data?.payment ?? firstOrder?.payment;
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
          source?.reference ??
          source?.data?.reference ??
          firstOrder?.payment?.reference;

        const referenceFromUrl = (() => {
          if (!authorizationUrl) return null;
          try {
            const parsed = new URL(authorizationUrl);
            return (
              parsed.searchParams.get('reference') ||
              parsed.searchParams.get('trxref')
            );
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

      console.log('💳 [Checkout] Initial payment values:', {
        hasAuthUrl: !!authorizationUrl,
        hasReference: !!resolvedReference,
        firstOrderId: firstOrder?.id,
        firstOrderGroupId: firstOrder?.order_group_id,
      });

      // If place-order response doesn't include payment link, initialize payment explicitly.
      if (!authorizationUrl && firstOrder) {
        const customerEmail =
          user?.email ?? (firstOrder as any)?.Customer?.email;

        console.log('💳 [Checkout] Initializing payment explicitly:', {
          email: customerEmail,
          orderId: firstOrder?.id,
          orderGroupId: firstOrder?.order_group_id,
        });

        if (customerEmail) {
          try {
            const initializedPayment = await api.payments.initializePayment(
              firstOrder?.order_group_id
                ? {
                    orderGroupId: firstOrder.order_group_id,
                    email: customerEmail,
                    callbackUrl: 'savemymeal://payment/callback',
                  }
                : {
                    orderId: firstOrder.id,
                    email: customerEmail,
                    callbackUrl: 'savemymeal://payment/callback',
                  },
            );

            console.log(
              '💳 [Checkout] Payment initialized:',
              initializedPayment,
            );

            const values = getPaymentValues(initializedPayment);
            authorizationUrl = values.authorizationUrl;
            resolvedReference = values.resolvedReference;

            console.log('💳 [Checkout] Payment values extracted:', {
              hasAuthUrl: !!authorizationUrl,
              hasReference: !!resolvedReference,
            });
          } catch (initError) {
            console.error(
              '💳 [Checkout] Payment initialization failed:',
              initError,
            );
          }
        }
      }

      // If we have a payment link but no reference, explicitly initialize again
      // to retrieve a usable Paystack reference for verification/auto-close.
      if (authorizationUrl && !resolvedReference && firstOrder) {
        const customerEmail =
          user?.email ?? (firstOrder as any)?.Customer?.email;

        console.log('💳 [Checkout] Re-initializing to get reference:', {
          email: customerEmail,
          hasAuthUrl: !!authorizationUrl,
        });

        if (customerEmail) {
          try {
            const initializedPayment = await api.payments.initializePayment(
              firstOrder?.order_group_id
                ? {
                    orderGroupId: firstOrder.order_group_id,
                    email: customerEmail,
                    callbackUrl: 'savemymeal://payment/callback',
                  }
                : {
                    orderId: firstOrder.id,
                    email: customerEmail,
                    callbackUrl: 'savemymeal://payment/callback',
                  },
            );

            const values = getPaymentValues(initializedPayment);
            authorizationUrl = values.authorizationUrl;
            resolvedReference = values.resolvedReference;

            console.log('💳 [Checkout] Reference recovered:', {
              hasAuthUrl: !!authorizationUrl,
              hasReference: !!resolvedReference,
            });
          } catch (initError) {
            console.error(
              '💳 [Checkout] Reference recovery failed:',
              initError,
            );
          }
        }
      }

      // Open Paystack only when we have both authorization URL and reference.
      if (authorizationUrl && resolvedReference) {
        console.log('💳 [Checkout] Opening Paystack with:', {
          reference: resolvedReference?.substring(0, 20) + '...',
          url: authorizationUrl?.substring(0, 50) + '...',
        });

        setPaymentReference(resolvedReference);
        setPaymentUrl(authorizationUrl);
        setShowPaymentWebView(true);

        // Store order info for success handling
        if (ordersList.length > 1 && firstOrder?.order_group_id) {
          setSuccessOrderId(null);
        } else if (firstOrder?.id) {
          setSuccessOrderId(firstOrder.id);
        }
      } else {
        // Payment initialization failed but order was created
        console.log('💳 [Checkout] Payment initialization failed:', {
          hasAuthUrl: !!authorizationUrl,
          hasReference: !!resolvedReference,
          error: response?.error,
        });
        clearCart.mutate();
        toast.warning(
          'Payment Initialization Failed',
          response?.error ||
            'Order created but payment could not be initialized. You can retry payment from your orders.',
        );
        // Navigate to orders page
        router.replace('/orders');
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error ??
        err.message ??
        'Failed to place order. Please try again.';
      toast.error('Order Failed', msg);
      console.error('Order placement failed:', err);
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
      setSuccessMessage(
        verification.requires_review
          ? verification.message ||
              'Your order is confirmed. An extra payment has been flagged for refund review.'
          : 'Payment successful! Your order has been confirmed.',
      );
      setSuccessDialogOpen(true);
    } catch (err) {
      console.error('Payment verification failed:', err);
      showPaymentStatus(
        'pending',
        'Payment status unavailable',
        'We could not check your payment yet. View your order and check its payment status before trying another payment.',
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

        if (status === 'success') {
          clearCart.mutate();
          setPaymentUrl(null);
          setPaymentReference(null);
          setSuccessMessage(
            verification.requires_review
              ? verification.message ||
                  'Your order is confirmed. An extra payment has been flagged for refund review.'
              : 'Payment successful! Your order has been confirmed.',
          );
          setSuccessDialogOpen(true);
          return;
        }

        if (status === 'failed' || status === 'reversed') {
          setPaymentUrl(null);
          setPaymentReference(null);
          showPaymentStatus(
            'error',
            'Payment unsuccessful',
            'Your payment was not completed. Open your order to review its status and retry payment.',
          );
          return;
        }

        if (status === 'abandoned') {
          setPaymentUrl(null);
          setPaymentReference(null);
          showPaymentStatus(
            'pending',
            'Payment window closed',
            'Your order is saved. Review its payment status before trying again.',
          );
          return;
        }

        if (status === 'pending') {
          showPaymentStatus(
            'pending',
            'Confirming your payment',
            'Your payment is still being confirmed. Check your order status before paying again.',
          );
          return;
        }
      } catch {
        showPaymentStatus(
          'pending',
          'Payment status unavailable',
          'We could not check whether payment completed. Check your order before making another payment.',
        );
        return;
      } finally {
        setIsProcessing(false);
      }
    }

    setPaymentUrl(null);
    setPaymentReference(null);
    showPaymentStatus(
      'pending',
      'Payment window closed',
      'Your order is saved. Review its payment status before trying again.',
    );
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
      if (
        stopped ||
        isAutoVerifyingRef.current ||
        rateLimitWaitMs(`/payments/verify/${paymentReference}`) > 0
      )
        return;

      attempts += 1;
      isAutoVerifyingRef.current = true;

      void api.payments
        .verifyPayment(paymentReference)
        .then((verification) => {
          if (stopped) return;

          if (getVerificationStatus(verification) === 'success') {
            stopped = true;
            clearInterval(interval);
            setShowPaymentWebView(false);
            setPaymentUrl(null);
            setPaymentReference(null);
            clearCart.mutate();
            setSuccessMessage(
              verification.requires_review
                ? verification.message ||
                    'Your order is confirmed. An extra payment has been flagged for refund review.'
                : 'Payment successful! Your order has been confirmed.',
            );
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

  if (authLoading || !isAuthenticated) return null;
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        title="Checkout"
        footer={
          <Action
            label={
              isProcessing
                ? 'Processing…'
                : total === 0
                  ? 'Confirm pickup order'
                  : `Pay ${formatCurrency(total)}`
            }
            onPress={handlePlaceOrder}
            busy={isProcessing}
            disabled={!canPlaceOrder || quoteNotReady}
          />
        }
      >
        <PageScroll>
          <View style={ui.between}>
            <View style={{ flex: 1 }}>
              <Text style={ui.heading}>Your pickup order</Text>
              <Text style={ui.muted}>
                Collect each meal directly from its vendor.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/cart')}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={ui.link}>Edit cart</Text>
            </Pressable>
          </View>
          {cart.length === 0 && (
            <Card>
              <Text style={ui.heading}>Your cart is empty</Text>
              <Action
                secondary
                label="Explore meals"
                onPress={() => router.push('/(tabs)/explore')}
              />
            </Card>
          )}
          {hasDeliveryItems && (
            <Card>
              <Text style={[ui.body, { color: palette.red }]}>
                This app supports pickup orders. Remove any delivery items from
                your cart and add them again for pickup before paying.
              </Text>
            </Card>
          )}
          {vendorGroups.map(([key, items]) => {
            const vendor = items[0].product?.vendor;
            return (
              <Card key={key}>
                <View style={ui.row}>
                  <AppImage
                    source={getImageSource(vendor?.logo)}
                    fallbackSource={require('@/assets/images/default-profile.jpg')}
                    style={{ width: 40, height: 40, borderRadius: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={ui.heading}>
                      {vendor?.business_name || 'Pickup vendor'}
                    </Text>
                    <Text style={ui.muted}>
                      {[vendor?.address, vendor?.city]
                        .filter(Boolean)
                        .join(', ') || 'View pickup details after confirmation'}
                    </Text>
                  </View>
                </View>
                <View style={ui.line} />
                {items.map((item) => (
                  <View key={item.id} style={{ gap: 6 }}>
                    <View style={ui.row}>
                      <AppImage
                        source={getImageSource(
                          item.product?.photo_url || item.product?.images?.[0],
                        )}
                        style={{ width: 48, height: 48, borderRadius: 10 }}
                      />
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text style={ui.body}>{item.product?.name}</Text>
                        <Text style={ui.muted}>
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </Text>
                      </View>
                      <Text style={ui.body}>
                        {formatCurrency(item.totalPrice)}
                      </Text>
                    </View>
                    {item.product?.pickup_start_time &&
                      item.product?.pickup_end_time && (
                        <Text style={ui.muted}>
                          {getEffectivePickupDay(
                            item.product.pickup_day,
                            item.product.pickup_end_time,
                          )}{' '}
                          · {formatTime12Hour(item.product.pickup_start_time)}–
                          {formatTime12Hour(item.product.pickup_end_time)}
                        </Text>
                      )}
                  </View>
                ))}
              </Card>
            );
          })}
          {growthConfig.data?.enabled && (
            <Card>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: offersOpen }}
                onPress={() => setOffersOpen(!offersOpen)}
                style={ui.between}
              >
                <View style={{ flex: 1 }}>
                  <Text style={ui.heading}>Offers & SMM Coin</Text>
                  <Text style={ui.muted}>
                    {serverQuote?.campaign?.name ||
                      (appliedCoins
                        ? `${appliedCoins} coins applied`
                        : 'Have a code or coins to use?')}
                  </Text>
                </View>
                <Text style={ui.link}>{offersOpen ? 'Hide' : 'Add'}</Text>
              </Pressable>
              {offersOpen && (
                <>
                  <TextInput
                    style={ui.input}
                    placeholder="Promotion code (optional)"
                    placeholderTextColor={palette.muted}
                    value={offerCode}
                    onChangeText={setOfferCode}
                    autoCapitalize="characters"
                    maxLength={40}
                  />
                  {growthConfig.data.coins_enabled && (
                    <>
                      <Text style={ui.muted}>
                        {rewards.isLoading
                          ? 'Loading coin balance…'
                          : rewards.isError
                            ? 'Balance unavailable. View Rewards to retry.'
                            : `${rewards.data?.account.available || 0} coins available`}
                        {rewards.data && growthConfig.data.coin_value_kobo
                          ? ` · ${formatCurrency((rewards.data.account.available * growthConfig.data.coin_value_kobo) / 100)}`
                          : ''}
                      </Text>
                      <Text style={ui.body}>Coins to use</Text>
                      <TextInput
                        accessibilityLabel="Coins to use"
                        style={ui.input}
                        value={coinInput}
                        onChangeText={setCoinInput}
                        keyboardType="number-pad"
                        maxLength={12}
                      />
                      <Pressable
                        onPress={() => router.push('/rewards')}
                        style={{ minHeight: 44, justifyContent: 'center' }}
                      >
                        <Text style={ui.link}>
                          View rewards and redemption details
                        </Text>
                      </Pressable>
                    </>
                  )}
                  <Action
                    secondary
                    label="Apply to order"
                    busy={quoteQuery.isFetching}
                    onPress={() => {
                      const coins = Number(coinInput);
                      if (
                        !Number.isSafeInteger(coins) ||
                        coins < 0 ||
                        (rewards.data && coins > rewards.data.account.available)
                      ) {
                        toast.warning(
                          'Invalid coins',
                          'Enter whole coins within your available balance.',
                        );
                        return;
                      }
                      const code = offerCode.trim().toUpperCase();
                      if (code === appliedCode && coins === appliedCoins) {
                        void quoteQuery.refetch();
                      } else {
                        setAppliedCode(code);
                        setAppliedCoins(coins);
                      }
                    }}
                  />
                  {(appliedCode || appliedCoins > 0) && (
                    <Action
                      secondary
                      label="Remove offer & coins"
                      onPress={() => {
                        setOfferCode('');
                        setCoinInput('0');
                        setAppliedCode('');
                        setAppliedCoins(0);
                      }}
                    />
                  )}{' '}
                </>
              )}
              {quoteQuery.isError && (
                <>
                  <Text
                    accessibilityRole="alert"
                    style={[ui.muted, { color: palette.red }]}
                  >
                    {quoteQuery.error.message}
                  </Text>
                  <Action
                    secondary
                    label="Refresh total"
                    onPress={() => void quoteQuery.refetch()}
                  />
                </>
              )}
            </Card>
          )}
          <Card>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: notesOpen }}
              onPress={() => setNotesOpen(!notesOpen)}
              style={ui.between}
            >
              <Text style={ui.heading}>
                Order note <Text style={ui.muted}>(optional)</Text>
              </Text>
              <Text style={ui.link}>{notesOpen ? 'Hide' : 'Add'}</Text>
            </Pressable>
            {notesOpen && (
              <TextInput
                style={[ui.input, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="Anything the vendor should know?"
                placeholderTextColor={palette.muted}
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
                multiline
                maxLength={500}
              />
            )}
          </Card>
          <Card>
            <Text style={ui.heading}>Payment</Text>
            <Text style={ui.body}>
              {total === 0
                ? 'Covered by your offer or SMM Coin'
                : 'Secure payment with Paystack'}
            </Text>
            <Text style={ui.muted}>
              {total === 0
                ? 'Confirm your order to reserve your pickup.'
                : 'Choose from the payment options available in Paystack at the next step.'}
            </Text>
          </Card>
          <Card>
            <Text style={ui.heading}>Price details</Text>
            <AmountRow
              label="Items subtotal"
              value={formatCurrency(
                serverQuote ? serverQuote.subtotal_kobo / 100 : subtotal,
              )}
            />
            <AmountRow
              label="Service fee"
              value={formatCurrency(
                serverQuote ? serverQuote.service_fee_kobo / 100 : serviceFee,
              )}
            />
            {!serverQuote && tax > 0 && (
              <AmountRow label="Tax" value={formatCurrency(tax)} />
            )}
            {!!serverQuote?.discount_kobo && (
              <AmountRow
                label="Offer savings"
                value={`−${formatCurrency(serverQuote.discount_kobo / 100)}`}
              />
            )}
            {!!serverQuote?.coins_kobo && (
              <AmountRow
                label="SMM Coin"
                value={`−${formatCurrency(serverQuote.coins_kobo / 100)}`}
              />
            )}
            <View style={ui.line} />
            <AmountRow
              total
              label="Total to pay"
              value={formatCurrency(total)}
            />
            {quoteQuery.isFetching && (
              <Text style={ui.muted}>Confirming your final total…</Text>
            )}
            {growthConfig.isError && (
              <>
                <Text style={[ui.muted, { color: palette.red }]}>
                  Unable to confirm current checkout pricing.
                </Text>
                <Action
                  secondary
                  label="Retry pricing"
                  onPress={() => void growthConfig.refetch()}
                />
              </>
            )}
          </Card>
        </PageScroll>
        <OutcomeDialog
          open={!!paymentOutcome}
          onClose={() => setPaymentOutcome(null)}
          kind={paymentOutcome?.kind || 'pending'}
          title={paymentOutcome?.title || ''}
          message={paymentOutcome?.message || ''}
          primaryLabel="View order status"
          onPrimary={() => {
            setPaymentOutcome(null);
            router.replace('/orders');
          }}
          secondaryLabel="Close"
          onSecondary={() => setPaymentOutcome(null)}
        />
        <OutcomeDialog
          open={successDialogOpen}
          onClose={() => setSuccessDialogOpen(false)}
          title="Your pickup order is confirmed"
          message={successMessage}
          primaryLabel="View order"
          onPrimary={() => {
            setSuccessDialogOpen(false);
            router.replace(
              successOrderId ? (`/order/${successOrderId}` as any) : '/orders',
            );
          }}
          secondaryLabel="Continue browsing"
          onSecondary={() => {
            setSuccessDialogOpen(false);
            router.replace('/(tabs)');
          }}
        />

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
      </Screen>
    </KeyboardAvoidingView>
  );
}
