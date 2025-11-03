import { useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '@/lib/hooks/use-profile';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import type { PaymentMethod } from '../types';

export default function PaymentsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user } = useProfile();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<PaymentMethod['type']>('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    name: ''
  });

  // Mock payment methods for demo
  const mockPaymentMethods: PaymentMethod[] = user?.paymentMethods || [
    {
      id: '1',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    },
    {
      id: '2',
      type: 'card',
      brand: 'mastercard',
      last4: '5555',
      expiryMonth: 8,
      expiryYear: 2024
    },
    {
      id: '3',
      type: 'apple_pay'
    }
  ];

  const handleAddPaymentMethod = () => {
    setFormData({
      cardNumber: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      name: ''
    });
    setShowAddForm(true);
  };

  const handleSavePaymentMethod = () => {
    if (selectedPaymentType === 'card') {
      if (!formData.cardNumber || !formData.expiryMonth || !formData.expiryYear || !formData.cvv || !formData.name) {
        Alert.alert('Error', 'Please fill in all card details.');
        return;
      }
    }

    // Here you would typically make an API call to save the payment method
    Alert.alert(
      'Success', 
      'Payment method added successfully!',
      [{ text: 'OK', onPress: () => setShowAddForm(false) }]
    );
  };

  const handleDeletePaymentMethod = (paymentId: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => {
          // Here you would typically make an API call to delete the payment method
          Alert.alert('Success', 'Payment method removed successfully!');
        }}
      ]
    );
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    if (method.type === 'apple_pay') return 'apple.logo';
    if (method.type === 'google_pay') return 'google.logo';
    
    switch (method.brand) {
      case 'visa': return 'creditcard.fill';
      case 'mastercard': return 'creditcard.fill';
      case 'amex': return 'creditcard.fill';
      default: return 'creditcard.fill';
    }
  };

  const getCardBrandColor = (brand?: string) => {
    switch (brand) {
      case 'visa': return '#1A1F71';
      case 'mastercard': return '#EB001B';
      case 'amex': return '#006FCF';
      default: return '#666';
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <IconSymbol name="arrow.left" size={24} color="#000" />
          </Pressable>
          <Text className="text-xl font-bold">Payment Methods</Text>
        </View>
        <Pressable onPress={handleAddPaymentMethod}>
          <IconSymbol name="plus" size={24} color="#3b82f6" />
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 py-4">
          {mockPaymentMethods.map((method) => (
            <View key={method.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-3">
                    <IconSymbol 
                      name={getPaymentIcon(method)} 
                      size={24} 
                      color={method.brand ? getCardBrandColor(method.brand) : "#666"} 
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-semibold text-base">
                        {method.type === 'apple_pay' ? 'Apple Pay' :
                         method.type === 'google_pay' ? 'Google Pay' :
                         `???? ???? ???? ${method.last4}`}
                      </Text>
                      {method.isDefault && (
                        <View className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                          <Text className="text-green-800 text-xs font-medium">Default</Text>
                        </View>
                      )}
                    </View>
                    {method.brand && (
                      <Text className="text-gray-600 capitalize">
                        {method.brand} ? Expires {method.expiryMonth?.toString().padStart(2, '0')}/{method.expiryYear}
                      </Text>
                    )}
                  </View>
                </View>
                
                <Pressable 
                  onPress={() => handleDeletePaymentMethod(method.id)}
                  className="p-2">
                  <IconSymbol name="trash" size={18} color="#ef4444" />
                </Pressable>
              </View>

              {!method.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => Alert.alert('Success', 'Set as default payment method!')}
                  className="mt-3 self-start">
                  Set as Default
                </Button>
              )}
            </View>
          ))}

          {/* Quick Payment Options */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-semibold mb-3">Quick Payment</Text>
            <View className="flex-row space-x-3">
              <Pressable 
                onPress={() => {
                  setSelectedPaymentType('apple_pay');
                  handleSavePaymentMethod();
                }}
                className="flex-1 border border-gray-200 rounded-lg p-4 items-center">
                <IconSymbol name="apple.logo" size={32} color="#000" />
                <Text className="mt-2 font-medium">Apple Pay</Text>
              </Pressable>
              <Pressable 
                onPress={() => {
                  setSelectedPaymentType('google_pay');
                  handleSavePaymentMethod();
                }}
                className="flex-1 border border-gray-200 rounded-lg p-4 items-center">
                <IconSymbol name="google.logo" size={32} color="#4285F4" />
                <Text className="mt-2 font-medium">Google Pay</Text>
              </Pressable>
            </View>
          </View>

          {mockPaymentMethods.length === 0 && (
            <View className="bg-white rounded-xl p-8 items-center">
              <IconSymbol name="creditcard" size={48} color="#ccc" />
              <Text className="text-xl font-semibold mt-4 mb-2">No payment methods</Text>
              <Text className="text-gray-500 text-center mb-4">
                Add a payment method to complete your orders
              </Text>
              <Button onPress={handleAddPaymentMethod}>
                Add Payment Method
              </Button>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Payment Method Bottom Sheet */}
      <BottomSheet
        visible={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add Payment Method">
        <ScrollView className="p-4">
          <View className="flex-row mb-4">
            <Pressable
              onPress={() => setSelectedPaymentType('card')}
              className={`flex-1 mr-2 p-4 rounded-lg border ${
                selectedPaymentType === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}>
              <View className="items-center">
                <IconSymbol name="creditcard.fill" size={32} color={selectedPaymentType === 'card' ? "#3b82f6" : "#666"} />
                <Text className={`mt-2 font-medium ${selectedPaymentType === 'card' ? 'text-blue-600' : 'text-gray-600'}`}>
                  Credit Card
                </Text>
              </View>
            </Pressable>
          </View>

          {selectedPaymentType === 'card' && (
            <>
              <Input
                label="Cardholder Name"
                placeholder="John Doe"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                className="mb-4"
              />

              <Input
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                value={formData.cardNumber}
                onChangeText={(text) => setFormData({ ...formData, cardNumber: formatCardNumber(text) })}
                keyboardType="numeric"
                maxLength={19}
                className="mb-4"
              />

              <View className="flex-row mb-4">
                <Input
                  label="MM"
                  placeholder="12"
                  value={formData.expiryMonth}
                  onChangeText={(text) => setFormData({ ...formData, expiryMonth: text })}
                  keyboardType="numeric"
                  maxLength={2}
                  className="w-16 mr-2"
                />
                <Input
                  label="YYYY"
                  placeholder="2025"
                  value={formData.expiryYear}
                  onChangeText={(text) => setFormData({ ...formData, expiryYear: text })}
                  keyboardType="numeric"
                  maxLength={4}
                  className="w-20 mr-4"
                />
                <Input
                  label="CVV"
                  placeholder="123"
                  value={formData.cvv}
                  onChangeText={(text) => setFormData({ ...formData, cvv: text })}
                  keyboardType="numeric"
                  maxLength={4}
                  className="w-16"
                />
              </View>
            </>
          )}

          <Button onPress={handleSavePaymentMethod} className="mb-4">
            Add Payment Method
          </Button>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}