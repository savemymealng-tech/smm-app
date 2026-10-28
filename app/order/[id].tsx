import { useProtectedRoute } from '@/lib/hooks/use-protected-route';
import { Screen, PageScroll, Message } from '@/components/ui/screen-kit';
import { PickupDetails } from '@/components/orders/pickup-details';
import { useQuery } from '@tanstack/react-query';
import { canPay } from '@/lib/order-display';
import { rateLimitWaitMs } from '@/lib/api/rate-limit';
import { OutcomeDialog } from '@/components/ui/outcome-dialog';
import { ReviewForm } from '@/components/reviews';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { PaystackWebView } from '@/components/ui/paystack-webview';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { useCancelOrder, useTrackOrder } from '@/lib/hooks';

import { useReviews } from '@/lib/hooks/use-reviews';
import { useVerifyPayment } from '@/lib/hooks/usePayments';
import type { Order, OrderItem } from '@/types/api';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

type OrderViewData =
  | { type: 'single'; order: Order }
  | {
      type: 'group';
      group: { order_group_id: string; orders: Order[]; grand_total: string };
    };

// ────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────

export default function OrderDetailScreen() {
  const { isAuthenticated, isLoading: authLoading } = useProtectedRoute();
  const { id } = useLocalSearchParams<{ id: string }>();

  console.log('OrderDetailScreen - Order ID:', id);

  // If the ID is not a pure number, treat it as a group ID or order_group_id
  const isGroupId = id ? isNaN(Number(id)) : false;

  const groupQuery = useQuery({
    queryKey: ['orders', 'group', id],
    queryFn: () => api.orders.groupDetails(id || ''),
    enabled: Boolean(isAuthenticated && isGroupId && id),
    refetchInterval: 30000,
  });
  const refetchOrders = groupQuery.refetch;
  const isRefetchingOrders = groupQuery.isRefetching;
  const {
    data: singleOrder,
    isLoading: isLoadingSingle,
    isRefetching: isRefetchingSingle,
    error: singleOrderError,
    refetch: refetchSingle,
  } = useTrackOrder(id || '', {
    enabled: isAuthenticated && !isGroupId && !!id,
  });

  console.log('OrderDetailScreen - Single Order:', {
    singleOrder,
    isLoadingSingle,
    error: singleOrderError,
    isGroupId,
  });

  const cancelOrder = useCancelOrder();

  const verifyPayment = useVerifyPayment();
  const { submitReview, submitting } = useReviews();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{
    kind: 'pending' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [reviewSheetOpen, setReviewSheetOpen] = useState(false);
  const [reviewingItem, setReviewingItem] = useState<OrderItem | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [retryingPaymentKey, setRetryingPaymentKey] = useState<string | null>(
    null,
  );
  const isAutoVerifyingRef = useRef(false);

  const orderData = useMemo<OrderViewData | null>(() => {
    if (!isGroupId)
      return singleOrder ? { type: 'single', order: singleOrder } : null;
    if (!groupQuery.data?.length) return null;
    return {
      type: 'group',
      group: {
        order_group_id: id || '',
        orders: groupQuery.data,
        grand_total: groupQuery.data
          .reduce((sum, o) => sum + Number(o.total_amount), 0)
          .toFixed(2),
      },
    };
  }, [id, isGroupId, singleOrder, groupQuery.data]);

  const isGroup = orderData?.type === 'group';
  const orders = useMemo(
    () =>
      orderData?.type === 'group'
        ? orderData.group.orders
        : orderData
          ? [orderData.order]
          : [],
    [orderData],
  );
  const displayOrder = orders[0];

  const refreshOrderData = useCallback(async () => {
    if (isGroupId) {
      await refetchOrders();
      return;
    }

    await Promise.all([refetchSingle(), refetchOrders()]);
  }, [isGroupId, refetchOrders, refetchSingle]);

  const clearPaymentState = useCallback(() => {
    setPaymentUrl(null);
    setPaymentReference(null);
  }, []);

  const getVerificationStatus = useCallback((result: any) => {
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
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshOrderData();
  }, [refreshOrderData]);

  const isRefreshing = isRefetchingOrders || isRefetchingSingle;

  // All useCallback hooks must be called before any conditional returns
  const handlePaymentSuccess = useCallback(async () => {
    if (!paymentReference) return;

    try {
      const verificationResult =
        await verifyPayment.mutateAsync(paymentReference);

      if (getVerificationStatus(verificationResult) === 'success') {
        clearPaymentState();
        await refreshOrderData();
        setSuccessDialogOpen(true);
        return;
      }

      setPaymentUrl(null);
      setPaymentNotice({
        kind: 'pending',
        title: 'Checking your payment',
        message:
          'Payment is not confirmed yet. Refresh this order before making another payment.',
      });
      await refreshOrderData();
    } catch (error: any) {
      setPaymentUrl(null);
      setPaymentNotice({
        kind: 'pending',
        title: 'Payment status unavailable',
        message:
          'We could not confirm your payment. Refresh the order status before trying again.',
      });
      console.error('[Order Detail] Payment verification unavailable:', error);
      await refreshOrderData();
    }
  }, [
    clearPaymentState,
    getVerificationStatus,
    paymentReference,
    refreshOrderData,
    verifyPayment,
  ]);

  const handlePaymentCancel = useCallback(async () => {
    if (paymentReference) {
      try {
        const verificationResult =
          await api.payments.verifyPayment(paymentReference);
        const status = getVerificationStatus(verificationResult);

        if (status === 'success') {
          clearPaymentState();
          await refreshOrderData();
          setSuccessDialogOpen(true);
          return;
        }

        if (status === 'failed' || status === 'reversed') {
          clearPaymentState();
          await refreshOrderData();
          setPaymentNotice({
            kind: 'error',
            title: 'Payment unsuccessful',
            message:
              'Payment was not completed. Review your order and retry payment when ready.',
          });
          return;
        }

        if (status === 'abandoned') {
          clearPaymentState();
          await refreshOrderData();
          toast.warning('Payment Cancelled', 'You cancelled the payment.');
          return;
        }

        if (status === 'pending') {
          await refreshOrderData();
          setPaymentUrl(null);
          setPaymentNotice({
            kind: 'pending',
            title: 'Confirming payment',
            message:
              'Your payment is still being confirmed. Check this order before paying again.',
          });
          return;
        }
      } catch {
        setPaymentUrl(null);
        setPaymentNotice({
          kind: 'pending',
          title: 'Payment status unavailable',
          message:
            'The payment window closed, but we could not check its final status. Refresh your order before paying again.',
        });
        return;
      }
    }

    clearPaymentState();
    await refreshOrderData();
    setPaymentNotice({
      kind: 'pending',
      title: 'Payment window closed',
      message: 'Check the order payment status before trying again.',
    });
  }, [
    clearPaymentState,
    getVerificationStatus,
    paymentReference,
    refreshOrderData,
  ]);

  const handleRetryPayment = useCallback(
    async (orderId?: number) => {
      console.log('[Order Detail] Retry payment initiated for order:', orderId);
      const retryKey = orderId ? `order-${orderId}` : `group-${String(id)}`;
      setRetryingPaymentKey(retryKey);

      const targetOrder = orderId
        ? orders.find((o) => o.id === orderId)
        : displayOrder;

      if (!targetOrder || !canPay(targetOrder)) {
        setRetryingPaymentKey(null);
        return;
      }
      if (!targetOrder?.Customer?.email) {
        toast.error('Error', 'Customer email not found');
        setRetryingPaymentKey(null);
        return;
      }

      const paymentGroupId =
        targetOrder.payment?.order_group_id || targetOrder.order_group_id;
      const isGroupedPayment =
        (isGroup && !orderId) || (!!paymentGroupId && !orderId);

      if (targetOrder.payment?.reference) {
        try {
          const verificationResult = await api.payments.verifyPayment(
            targetOrder.payment.reference,
          );
          const status = getVerificationStatus(verificationResult);

          if (status === 'success') {
            clearPaymentState();
            await refreshOrderData();
            toast.success('Payment Verified', 'Order has already been paid');
            setRetryingPaymentKey(null);
            return;
          }

          if (!['failed', 'abandoned', 'reversed'].includes(status || '')) {
            setPaymentNotice({
              kind: 'pending',
              title: 'Payment is still pending',
              message:
                'We are waiting for a final payment status. Refresh this order before trying again.',
            });
            setRetryingPaymentKey(null);
            await refreshOrderData();
            return;
          }
        } catch {
          setPaymentNotice({
            kind: 'pending',
            title: 'Payment status unavailable',
            message:
              'We could not verify the previous payment. Please check again before paying.',
          });
          setRetryingPaymentKey(null);
          return;
        }
      }

      try {
        const data = await api.payments.initializePayment(
          isGroupedPayment && paymentGroupId
            ? {
                orderGroupId: paymentGroupId,
                email: targetOrder.Customer.email,
                callbackUrl: 'savemymeal://payment/callback',
              }
            : {
                orderId: targetOrder.id,
                email: targetOrder.Customer.email,
                callbackUrl: 'savemymeal://payment/callback',
              },
        );

        setPaymentUrl(data.authorization_url);
        setPaymentReference(data.reference);
      } catch (error: any) {
        console.error('[Order Detail] Payment initialization error:', error);
        const errorMessage =
          error?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Failed to initialize payment';
        const normalizedMessage = String(errorMessage).toLowerCase();

        if (
          normalizedMessage.includes('already been paid') ||
          normalizedMessage.includes('already paid')
        ) {
          toast.success('Payment Verified', 'Order has already been paid');
          await refreshOrderData();
          return;
        }

        toast.error('Payment Failed', errorMessage);
      } finally {
        setRetryingPaymentKey(null);
      }
    },
    [
      clearPaymentState,
      displayOrder,
      id,
      isGroup,
      orders,
      refreshOrderData,
      getVerificationStatus,
    ],
  );

  useEffect(() => {
    if (!paymentUrl || !paymentReference) return;

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
        .then(async (verificationResult) => {
          if (stopped) return;

          if (getVerificationStatus(verificationResult) === 'success') {
            stopped = true;
            clearInterval(interval);
            clearPaymentState();
            await refreshOrderData();
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
  }, [
    clearPaymentState,
    getVerificationStatus,
    paymentReference,
    paymentUrl,
    refreshOrderData,
  ]);

  // Memoize PaystackWebView to prevent unnecessary re-renders
  const paystackWebView = useMemo(
    () =>
      paymentUrl && paymentReference ? (
        <PaystackWebView
          visible={true}
          authorizationUrl={paymentUrl}
          reference={paymentReference}
          onClose={handlePaymentCancel}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCancel={handlePaymentCancel}
        />
      ) : null,
    [paymentUrl, paymentReference, handlePaymentCancel, handlePaymentSuccess],
  );

  if (authLoading || !isAuthenticated) return null;
  if (isGroupId ? groupQuery.isLoading : isLoadingSingle)
    return (
      <Screen title="Order details">
        <PageScroll>
          <Message title="Loading your order…" />
        </PageScroll>
      </Screen>
    );
  if (!orderData)
    return (
      <Screen title="Order details">
        <PageScroll>
          <Message
            title="Unable to load this order"
            body={
              (isGroupId ? groupQuery.error : singleOrderError)?.message ||
              'Order not found or access is unavailable.'
            }
            onRetry={() => void refreshOrderData()}
          />
        </PageScroll>
      </Screen>
    );
  const confirmCancel = async () => {
    if (!cancelTarget || cancelOrder.isPending) return;
    try {
      await cancelOrder.mutateAsync(String(cancelTarget.id));
      await refreshOrderData();
      setCancelDialogOpen(false);
    } catch (error) {
      toast.error(
        'Unable to cancel',
        (error as Error).message || 'Check the order status and try again.',
      );
    }
  };
  const handleReviewPress = (item: OrderItem, order: Order) => {
    setReviewingItem(item);
    setCurrentOrder(order);
    setReviewSheetOpen(true);
  };

  const handleReviewSubmit = async (data: {
    rating: number;
    comment: string;
  }) => {
    if (!reviewingItem || !currentOrder) return;

    try {
      await submitReview({
        order_id: currentOrder.id,
        product_id: reviewingItem.product_id,
        rating: data.rating,
        comment: data.comment,
      });

      toast.success('Review Submitted', 'Thank you for your feedback!');
      setReviewSheetOpen(false);
      setReviewingItem(null);
      setCurrentOrder(null);
    } catch (error: any) {
      console.error('Review submission error:', error);
      // Handle both API error format (error.error) and standard Error (error.message)
      const errorMessage =
        error.error || error.message || 'Failed to submit review';
      toast.error('Error', errorMessage);
    }
  };

  const handleReviewCancel = () => {
    setReviewSheetOpen(false);
    setReviewingItem(null);
    setCurrentOrder(null);
  };

  return (
    <Screen title="Order details">
      <PageScroll
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#008236"
          />
        }
      >
        <PickupDetails
          orders={orders}
          onCancel={(order) => {
            setCancelTarget(order);
            setCancelDialogOpen(true);
          }}
          onPay={(order) => void handleRetryPayment(order?.id)}
          onReview={handleReviewPress}
          paying={retryingPaymentKey !== null}
          cancelling={cancelOrder.isPending}
        />
      </PageScroll>
      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent compact>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelTarget?.checkout_id
                ? 'This cancels all unpaid orders in this checkout and releases reserved coins and offers. Payments still awaiting confirmation must be verified first.'
                : 'Cancel this pending order? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>No</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              tone="destructive"
              disabled={cancelOrder.isPending}
              onPress={confirmCancel}
              className="bg-red-600"
            >
              <Text className="text-white">Yes, Cancel</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OutcomeDialog
        open={!!paymentNotice}
        onClose={() => setPaymentNotice(null)}
        kind={paymentNotice?.kind || 'pending'}
        title={paymentNotice?.title || ''}
        message={paymentNotice?.message || ''}
        primaryLabel="Refresh order status"
        onPrimary={() => {
          setPaymentNotice(null);
          void refreshOrderData();
        }}
        secondaryLabel="Close"
        onSecondary={() => setPaymentNotice(null)}
      />
      <OutcomeDialog
        open={successDialogOpen}
        onClose={() => setSuccessDialogOpen(false)}
        title="Payment confirmed"
        message="Your payment has been confirmed. Check your order for pickup updates."
        primaryLabel="Back to order"
        onPrimary={() => {
          setSuccessDialogOpen(false);
          void refreshOrderData();
        }}
      />

      {/* Review Bottom Sheet */}
      <BottomSheet
        visible={reviewSheetOpen}
        onClose={handleReviewCancel}
        title="Write a Review"
      >
        <ReviewForm
          productName={reviewingItem?.product?.name}
          orderId={currentOrder?.id}
          productId={reviewingItem?.product_id}
          onSubmit={handleReviewSubmit}
          onCancel={handleReviewCancel}
          loading={submitting}
        />
      </BottomSheet>

      {/* Paystack Payment WebView */}
      {paystackWebView}
    </Screen>
  );
}
