import { View, ScrollView, Pressable, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrency } from '@/lib/utils';
import type { OrderStatus } from '../../types';

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Mock order data - in real app, fetch by ID
  const order = {
    id: id || '1',
    vendor: {
      name: 'Burger Palace',
      logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2340',
      phone: '+1 (555) 123-4567'
    },
    status: 'delivered' as OrderStatus,
    items: [
      {
        id: '1',
        name: 'Classic Cheeseburger',
        quantity: 2,
        price: 12.99,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2340',
        customizations: ['Extra cheese', 'No onions']
      },
      {
        id: '2',
        name: 'French Fries',
        quantity: 1,
        price: 4.99,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?q=80&w=2069'
      }
    ],
    address: {
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102'
    },
    paymentMethod: 'Visa ending in 4242',
    orderTime: '2024-01-15T18:45:00Z',
    deliveryTime: '2024-01-15T19:25:00Z',
    subtotal: 30.97,
    deliveryFee: 2.99,
    tax: 2.79,
    total: 36.75,
    rating: 5
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'on_the_way': return 'text-blue-600 bg-blue-100';
      case 'preparing': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
        
        <Pressable onPress={() => router.push(`/vendor/${order.vendor.name}`)}>
          <Text className="text-primary font-medium">Reorder</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {/* Order Status */}
        <View className="bg-white p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold">Order #{order.id}</Text>
            <View className={`px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
              <Text className="text-sm font-medium">
                {order.status === 'delivered' ? 'Delivered' : 
                 order.status === 'on_the_way' ? 'On the Way' :
                 order.status === 'preparing' ? 'Preparing' : order.status}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center mb-2">
            <IconSymbol name="calendar" size={16} color="#666" />
            <Text className="ml-2 text-gray-600">Ordered: {formatDate(order.orderTime)}</Text>
          </View>
          
          {order.deliveryTime && (
            <View className="flex-row items-center">
              <IconSymbol name="checkmark.circle.fill" size={16} color="#10b981" />
              <Text className="ml-2 text-gray-600">Delivered: {formatDate(order.deliveryTime)}</Text>
            </View>
          )}
        </View>

        {/* Vendor Info */}
        <View className="bg-white p-4 mb-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image
                source={{ uri: order.vendor.logo }}
                className="w-12 h-12 rounded-full mr-3"
                resizeMode="cover"
              />
              <View>
                <Text className="font-semibold text-base">{order.vendor.name}</Text>
                <Text className="text-gray-600">{order.vendor.phone}</Text>
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
                source={{ uri: item.image }}
                className="w-16 h-16 rounded-lg mr-3"
                resizeMode="cover"
              />
              <View className="flex-1">
                <View className="flex-row items-start justify-between mb-1">
                  <Text className="font-semibold flex-1" numberOfLines={2}>{item.name}</Text>
                  <Text className="font-bold ml-2">{formatCurrency(item.price)}</Text>
                </View>
                <Text className="text-gray-600 text-sm mb-1">Qty: {item.quantity}</Text>
                {item.customizations && (
                  <Text className="text-blue-600 text-xs">
                    {item.customizations.join(', ')}
                  </Text>
                )}
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
              {order.address.street}, {order.address.city}, {order.address.state} {order.address.zipCode}
            </Text>
          </View>
        </View>

        {/* Payment Summary */}
        <View className="bg-white p-4 mb-4">
          <Text className="text-lg font-semibold mb-3">Payment Summary</Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Subtotal</Text>
            <Text className="font-medium">{formatCurrency(order.subtotal)}</Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Delivery Fee</Text>
            <Text className="font-medium">{formatCurrency(order.deliveryFee)}</Text>
          </View>
          
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600">Tax</Text>
            <Text className="font-medium">{formatCurrency(order.tax)}</Text>
          </View>
          
          <View className="border-t border-gray-200 pt-3">
            <View className="flex-row justify-between mb-3">
              <Text className="text-lg font-bold">Total</Text>
              <Text className="text-lg font-bold">{formatCurrency(order.total)}</Text>
            </View>
            
            <View className="flex-row items-center">
              <IconSymbol name="creditcard.fill" size={16} color="#666" />
              <Text className="ml-2 text-gray-600">{order.paymentMethod}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        {order.status === 'delivered' && (
          <View className="px-4 pb-6">
            <View className="bg-white rounded-xl p-4">
              {order.rating ? (
                <View className="items-center">
                  <Text className="text-lg font-semibold mb-2">Your Rating</Text>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <IconSymbol
                        key={star}
                        name="star.fill"
                        size={24}
                        color={star <= order.rating ? "#fbbf24" : "#e5e7eb"}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <View>
                  <Text className="text-lg font-semibold mb-2 text-center">Rate Your Order</Text>
                  <Text className="text-gray-600 text-center mb-4">
                    Help others by rating your experience
                  </Text>
                  <Button onPress={() => router.push(`/order/${order.id}/review`)}>
                    Leave Review
                  </Button>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}