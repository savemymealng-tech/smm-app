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
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { useCancelOrder, useReorder, useTrackOrder } from '@/lib/hooks';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUS_COLORS = {
  pending: 'text-yellow-600 bg-yellow-100',
  confirmed: 'text-blue-600 bg-blue-100',
  preparing: 'text-purple-600 bg-purple-100',
  ready: 'text-green-600 bg-green-100',
  out_for_delivery: 'text-orange-600 bg-orange-100',
  delivered: 'text-green-600 bg-green-100',
  cancelled: 'text-red-600 bg-red-100',
};

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: order, isLoading, refetch } = useTrackOrder(id || '');
  const cancelOrderMutation = useCancelOrder();
  const reorderMutation = useReorder();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const handleReorder = () => {
    if (order) {
      reorderMutation.mutate(order as any);
    }
  };

  const handleCancelOrder = () => {
    if (!order || order.status !== 'pending') {
      toast.warning('Cannot Cancel', 'Only pending orders can be cancelled.');
      return;
    }
    setCancelDialogOpen(true);
  };

  const confirmCancelOrder = () => {
    if (order) {
      cancelOrderMutation.mutate(String(order.id), {
        onSuccess: () => {
          refetch();
        },
      });
    }
    setCancelDialogOpen(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
        <View className="px-4 py-3 bg-white border-b border-gray-200">
          <Skeleton className="w-32 h-6" />
        </View>
        <View className="p-4">
          <Skeleton className="w-full h-64 rounded-2xl mb-4" />
          <Skeleton className="w-full h-32 rounded-2xl" />
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-semibold">Order not found</Text>
        <Button onPress={() => router.back()} className="mt-4">
          <Text className="text-white">Go Back</Text>
        </Button>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <IconSymbol name="arrow.left" size={24} color="#000" />
          </Pressable>
          <Text className="text-xl font-bold">Order Details</Text>
        </View>
        
        {order.status === 'pending' && (
          <Button
            onPress={handleCancelOrder}
            disabled={cancelOrderMutation.isPending}
            className="bg-red-600"
          >
            {cancelOrderMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white">Cancel</Text>
            )}
          </Button>
        )}
      </View>

      <ScrollView className="flex-1">
        {/* Order Status */}
        <View className="bg-white p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold">Order #{order.id}</Text>
            <View className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
              <Text className="text-sm font-medium">
                {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center mb-2">
            <IconSymbol name="calendar" size={16} color="#666" />
            <Text className="ml-2 text-gray-600">Ordered: {formatDate(order.createdAt)}</Text>
          </View>
          
          {order.status === 'delivered' && (
            <View className="flex-row items-center mt-1">
              <IconSymbol name="checkmark.circle.fill" size={16} color="#10b981" />
              <Text className="ml-2 text-gray-600">Status: Delivered</Text>
            </View>
          )}
          
          {order.estimated_delivery_time && order.status !== 'delivered' && (
            <View className="flex-row items-center mt-2">
              <IconSymbol name="clock" size={16} color="#F39C12" />
              <Text className="ml-2 text-gray-600">
                Estimated: {formatDate(order.estimated_delivery_time)}
              </Text>
            </View>
          )}
        </View>

        {/* Vendor Info */}
        <View className="bg-white p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image
                source={order.vendor?.logo ? { uri: order.vendor.logo } : require('@/assets/images/default-profile.jpg')}
                className="w-12 h-12 rounded-full mr-3"
                resizeMode="cover"
              />
              <View>
                <Text className="font-semibold text-base">{order.vendor?.business_name || 'Vendor'}</Text>
                <Text className="text-gray-600">{order.vendor?.phone || ''}</Text>
              </View>
            </View>
            
            <Pressable className="bg-gray-100 rounded-full p-2">
              <IconSymbol name="phone.fill" size={20} color="#666" />
            </Pressable>
          </View>
        </View>

        {/* Order Items */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Items ({order.items.length})</Text>
          
          {order.items.map((item, index) => (
            <View key={item.id} className={`flex-row py-3 ${index < order.items.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <Image
                source={item.product.photo_url ? { uri: item.product.photo_url } : require('@/assets/images/default-product.jpg')}
                className="w-16 h-16 rounded-lg mr-3"
                resizeMode="cover"
              />
              <View className="flex-1">
                <View className="flex-row items-start justify-between mb-1">
                  <Text className="font-semibold flex-1" numberOfLines={2}>{item.product.name}</Text>
                  <Text className="font-bold ml-2">₦{parseFloat(item.price).toFixed(0)}</Text>
                </View>
                <Text className="text-gray-600 text-sm mb-1">Qty: {item.quantity}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Delivery Address</Text>
          <View className="flex-row">
            <IconSymbol name="location.fill" size={20} color="#666" />
            <Text className="ml-2 text-gray-700 flex-1">
              {order.delivery_address.street}, {order.delivery_address.city}, {order.delivery_address.state} {order.delivery_address.postal_code || ''}
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Payment Summary</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Subtotal</Text>
            <Text className="font-medium">₦{order.items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0).toFixed(0)}</Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Delivery Fee</Text>
            <Text className="font-medium">₦{parseFloat(order.delivery_fee).toFixed(0)}</Text>
          </View>
          
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600">Service Fee</Text>
            <Text className="font-medium">₦{parseFloat(order.service_fee).toFixed(0)}</Text>
          </View>
          
          <View className="border-t border-gray-200 pt-3">
            <View className="flex-row justify-between mb-3">
              <Text className="text-lg font-bold">Total</Text>
              <Text className="text-lg font-bold">₦{parseFloat(order.total_amount).toFixed(0)}</Text>
            </View>
            
            <View className="flex-row items-center">
              <IconSymbol name="creditcard.fill" size={16} color="#666" />
              <Text className="ml-2 text-gray-600">{order.payment_method.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {order.status === 'delivered' && (
          <View className="px-4 pb-6">
            {/* Reorder Section */}
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-lg font-semibold mb-2 text-center">Order Again?</Text>
              <Text className="text-gray-600 text-center mb-4">
                Add the same items to your cart
              </Text>
              <Button 
                variant="outline"
                onPress={handleReorder}
                disabled={reorderMutation.isPending}
              >
                {reorderMutation.isPending ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#15785B" />
                    <Text className="ml-2 text-primary">Adding to cart...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center">
                    <IconSymbol name="arrow.clockwise" size={18} color="#15785B" />
                    <Text className="ml-2 text-primary">Reorder</Text>
                  </View>
                )}
              </Button>
            </View>

            {/* Rate Order Section */}
            <View className="bg-white rounded-xl p-4">
              <Text className="text-lg font-semibold mb-2 text-center">Rate Your Order</Text>
              <Text className="text-gray-600 text-center mb-4">
                Help others by rating your experience
              </Text>
              <Button onPress={() => router.push(`/order/${order.id}/review`)}>
                <Text className="text-white">Leave Review</Text>
              </Button>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Cancel Order Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>No</Text>
            </AlertDialogCancel>
            <AlertDialogAction onPress={confirmCancelOrder} className="bg-red-500">
              <Text className="text-white">Yes, Cancel</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
