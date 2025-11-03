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
import type { Address } from '../types';

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user } = useProfile();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'home' as Address['type']
  });

  // Mock addresses for demo
  const mockAddresses: Address[] = user?.addresses || [
    {
      id: '1',
      type: 'home',
      label: 'Home',
      street: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA',
      isDefault: true
    },
    {
      id: '2',
      type: 'work',
      label: 'Office',
      street: '456 Business Ave',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      country: 'USA'
    }
  ];

  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData({
      label: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      type: 'home'
    });
    setShowAddForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      type: address.type
    });
    setShowAddForm(true);
  };

  const handleSaveAddress = () => {
    if (!formData.label || !formData.street || !formData.city || !formData.state || !formData.zipCode) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    // Here you would typically make an API call to save the address
    Alert.alert(
      'Success', 
      editingAddress ? 'Address updated successfully!' : 'Address added successfully!',
      [{ text: 'OK', onPress: () => setShowAddForm(false) }]
    );
  };

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // Here you would typically make an API call to delete the address
          Alert.alert('Success', 'Address deleted successfully!');
        }}
      ]
    );
  };

  const getAddressIcon = (type: Address['type']) => {
    switch (type) {
      case 'home': return 'house.fill';
      case 'work': return 'building.2.fill';
      default: return 'location.fill';
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
          <Text className="text-xl font-bold">Delivery Addresses</Text>
        </View>
        <Pressable onPress={handleAddAddress}>
          <IconSymbol name="plus" size={24} color="#3b82f6" />
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        <View className="px-4 py-4">
          {mockAddresses.map((address) => (
            <View key={address.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <IconSymbol name={getAddressIcon(address.type)} size={20} color="#3b82f6" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-semibold text-base">{address.label}</Text>
                      {address.isDefault && (
                        <View className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                          <Text className="text-green-800 text-xs font-medium">Default</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-gray-600 mt-1">
                      {address.street}, {address.city}, {address.state} {address.zipCode}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-center ml-2">
                  <Pressable 
                    onPress={() => handleEditAddress(address)}
                    className="p-2">
                    <IconSymbol name="pencil" size={18} color="#666" />
                  </Pressable>
                  <Pressable 
                    onPress={() => handleDeleteAddress(address.id)}
                    className="p-2">
                    <IconSymbol name="trash" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              </View>

              {!address.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => Alert.alert('Success', 'Set as default address!')}
                  className="mt-2 self-start">
                  Set as Default
                </Button>
              )}
            </View>
          ))}

          {mockAddresses.length === 0 && (
            <View className="bg-white rounded-xl p-8 items-center">
              <IconSymbol name="location" size={48} color="#ccc" />
              <Text className="text-xl font-semibold mt-4 mb-2">No addresses yet</Text>
              <Text className="text-gray-500 text-center mb-4">
                Add your delivery addresses to make ordering faster
              </Text>
              <Button onPress={handleAddAddress}>
                Add Address
              </Button>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Address Bottom Sheet */}
      <BottomSheet
        visible={showAddForm}
        onClose={() => setShowAddForm(false)}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}>
        <ScrollView className="p-4">
          <Input
            label="Label"
            placeholder="Home, Work, etc."
            value={formData.label}
            onChangeText={(text) => setFormData({ ...formData, label: text })}
            className="mb-4"
          />

          <View className="flex-row mb-4">
            {(['home', 'work', 'other'] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => setFormData({ ...formData, type })}
                className={`flex-1 mr-2 p-3 rounded-lg border ${
                  formData.type === type ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                }`}>
                <View className="items-center">
                  <IconSymbol name={getAddressIcon(type)} size={24} color={formData.type === type ? "#3b82f6" : "#666"} />
                  <Text className={`mt-1 capitalize ${formData.type === type ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                    {type}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Input
            label="Street Address"
            placeholder="123 Main Street"
            value={formData.street}
            onChangeText={(text) => setFormData({ ...formData, street: text })}
            className="mb-4"
          />

          <View className="flex-row mb-4">
            <Input
              label="City"
              placeholder="San Francisco"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              className="flex-1 mr-2"
            />
            <Input
              label="State"
              placeholder="CA"
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
              className="w-20"
            />
          </View>

          <Input
            label="ZIP Code"
            placeholder="94102"
            value={formData.zipCode}
            onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
            keyboardType="numeric"
            className="mb-6"
          />

          <Button onPress={handleSaveAddress} className="mb-4">
            {editingAddress ? 'Update Address' : 'Save Address'}
          </Button>
        </ScrollView>
      </BottomSheet>
    </View>
  );
}