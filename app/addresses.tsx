import { useState, useEffect } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '@/lib/hooks/use-profile';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import apiClient, { extractData } from '@/lib/api/client';
import { API_CONFIG } from '@/lib/api/config';
import type { Address } from '../types';

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: user, refetch: refetchProfile } = useProfile();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<string | null>(null);
  const [dialogMessage, setDialogMessage] = useState('');
  const [formData, setFormData] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    type: 'home' as Address['type'],
    country: 'USA'
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.ADDRESSES.LIST);
      const data = extractData<Address[]>(response);
      setAddresses(data || []);
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      setDialogMessage(error?.error || 'Failed to load addresses');
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData({
      label: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      type: 'home',
      country: 'USA'
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
      type: address.type,
      country: address.country || 'USA'
    });
    setShowAddForm(true);
  };

  const handleSaveAddress = async () => {
    if (!formData.label || !formData.street || !formData.city || !formData.state || !formData.zipCode) {
      setDialogMessage('Please fill in all required fields.');
      setShowErrorDialog(true);
      return;
    }

    try {
      setSaving(true);
      if (editingAddress) {
        // Update existing address
        const response = await apiClient.put(
          API_CONFIG.ENDPOINTS.ADDRESSES.UPDATE(parseInt(editingAddress.id)),
          formData
        );
        const updatedAddress = extractData<Address>(response);
        setAddresses(addresses.map(addr =>
          addr.id === editingAddress.id ? updatedAddress : addr
        ));
        setDialogMessage('Address updated successfully!');
      } else {
        // Create new address
        const response = await apiClient.post(
          API_CONFIG.ENDPOINTS.ADDRESSES.CREATE,
          formData
        );
        const newAddress = extractData<Address>(response);
        setAddresses([...addresses, newAddress]);
        setDialogMessage('Address added successfully!');
      }
      setShowAddForm(false);
      setShowSuccessDialog(true);
      refetchProfile();
    } catch (error: any) {
      console.error('Error saving address:', error);
      setDialogMessage(error?.error || 'Failed to save address. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    setDeleteAddressId(addressId);
    setShowDeleteDialog(() => true);
  };

  const confirmDeleteAddress = async () => {
    if (!deleteAddressId) return;

    try {
      setSaving(true);
      await apiClient.delete(API_CONFIG.ENDPOINTS.ADDRESSES.DELETE(parseInt(deleteAddressId)));
      setAddresses(addresses.filter(addr => addr.id !== deleteAddressId));
      setShowDeleteDialog(false);
      setDialogMessage('Address deleted successfully!');
      setShowSuccessDialog(true);
      refetchProfile();
    } catch (error: any) {
      console.error('Error deleting address:', error);
      setDialogMessage(error?.error || 'Failed to delete address. Please try again.');
      setShowErrorDialog(true);
      setShowDeleteDialog(false);
    } finally {
      setSaving(false);
      setDeleteAddressId(null);
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      setSaving(true);
      const response = await apiClient.post(
        API_CONFIG.ENDPOINTS.ADDRESSES.SET_DEFAULT(parseInt(addressId))
      );
      const updatedAddress = extractData<Address>(response);
      setAddresses(addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === addressId
      })));
      setDialogMessage('Default address updated successfully!');
      setShowSuccessDialog(true);
      refetchProfile();
    } catch (error: any) {
      console.error('Error setting default address:', error);
      setDialogMessage(error?.error || 'Failed to set default address. Please try again.');
      setShowErrorDialog(true);
    } finally {
      setSaving(false);
    }
  };

  const getAddressIcon = (type: Address['type']) => {
    switch (type) {
      case 'home': return 'house.fill';
      case 'work': return 'building.2.fill';
      default: return 'location.fill';
    }
  };

  return (
    <View className="flex flex-col flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-3 bg-white border-b border-gray-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Pressable onPress={() => router.back()} className="mr-3">
            <IconSymbol name="arrow.left" size={24} color="#000" />
          </Pressable>
          <Text className="text-xl font-bold">Delivery Addresses</Text>
        </View>
        <Pressable onPress={handleAddAddress} disabled={saving}>
          <IconSymbol name="plus" size={24} color={saving ? "#999" : "#15785B"} />
        </Pressable>
      </View>

      {loading ? (
        <ScrollView className="flex flex-col" showsVerticalScrollIndicator={false}>
          <View className="px-4 py-4">
            <Text className="text-lg font-bold">Loading addresses...</Text>
            {[...Array(3)].map((_, index) => (
              <View key={index} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-row items-center flex-1">
                    <Skeleton className="w-12 h-12 rounded-full mr-3" />
                    <View className="flex-1">
                      <View className="flex-row items-center mb-2">
                        <Skeleton className="h-5 w-24 rounded" />
                        <Skeleton className="h-4 w-16 rounded-full ml-2" />
                      </View>
                      <Skeleton className="h-4 w-full rounded mb-1" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </View>
                  </View>
                  <View className="flex-row items-center ml-2">
                    <Skeleton className="w-10 h-10 rounded mr-2" />
                    <Skeleton className="w-10 h-10 rounded" />
                  </View>
                </View>
                <Skeleton className="h-9 w-32 rounded mt-2" />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView className="flex flex-col" showsVerticalScrollIndicator={false}>
          <View className="px-4 py-4">
              {addresses.map((address) => (
                <View key={address.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
                        <IconSymbol name={getAddressIcon(address.type)} size={22} color="#15785B" />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center flex-wrap">
                          <Text className="font-semibold text-base text-gray-900">{address.label}</Text>
                          {address.isDefault && (
                            <View className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                              <Text className="text-green-800 text-xs font-medium">Default</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-600 mt-1 text-sm leading-5">
                          {address.street}, {address.city}, {address.state} {address.zipCode}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center ml-2">
                      <Pressable
                        onPress={() => handleEditAddress(address)}
                        disabled={saving}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        className="p-2">
                        <IconSymbol name="pencil" size={18} color={saving ? "#999" : "#666"} />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteAddress(address.id)}
                        disabled={saving}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        className="p-2">
                        <IconSymbol name="trash" size={18} color={saving ? "#999" : "#ef4444"} />
                      </Pressable>
                    </View>
                  </View>

                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() => handleSetDefault(address.id)}
                      disabled={saving}
                      className="mt-2 self-start">
                      Set as Default
                    </Button>
                  )}
                </View>
              ))}

              {addresses.length === 0 && (
                <View className="flex-1 items-center justify-center px-4 py-12">
                  <View className="bg-white rounded-xl p-8 items-center w-full max-w-sm">
                    <View className="w-24 h-24 rounded-full bg-gray-100 items-center justify-center mb-6">
                      <IconSymbol name="location" size={48} color="#999" />
                    </View>
                    <Text className="text-2xl font-bold mb-2 text-gray-900">No addresses yet</Text>
                    <Text className="text-gray-500 text-center mb-8 px-4 leading-6">
                      Add your delivery addresses to make ordering faster and easier
                    </Text>
                    <Button onPress={handleAddAddress} disabled={saving} className="w-full">
                      <Text className="text-white font-semibold">Add Your First Address</Text>
                    </Button>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
      )}

      {/* Add/Edit Address Bottom Sheet */}
      <BottomSheet
        visible={showAddForm}
        onClose={() => !saving && setShowAddForm(false)}
        title={editingAddress ? 'Edit Address' : 'Add New Address'}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 24,
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={true}
          bounces={true}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled">

          {/* Label Input */}
          <View className="mb-6">
            <Input
              label="Label"
              placeholder="Home, Work, etc."
              value={formData.label}
              onChangeText={(text) => setFormData({ ...formData, label: text })}
              editable={!saving}
            />
          </View>

          {/* Address Type Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-900 mb-3">Address Type</Text>
            <View className="flex-row gap-3">
              {(['home', 'work', 'other'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => !saving && setFormData({ ...formData, type })}
                  disabled={saving}
                  className={`flex-1 p-4 rounded-xl border-2 ${formData.type === type
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 bg-white'
                    } ${saving ? 'opacity-50' : ''}`}>
                  <View className="items-center">
                    <IconSymbol
                      name={getAddressIcon(type)}
                      size={28}
                      color={formData.type === type ? "#15785B" : "#666"}
                    />
                    <Text className={`mt-2 capitalize text-sm font-medium ${formData.type === type ? 'text-primary' : 'text-gray-600'
                      }`}>
                      {type}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Street Address */}
          <View className="mb-6">
            <Input
              label="Street Address"
              placeholder="123 Main Street"
              value={formData.street}
              onChangeText={(text) => setFormData({ ...formData, street: text })}
              editable={!saving}
            />
          </View>

          {/* City and State */}
          <View className="mb-6">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="City"
                  placeholder="San Francisco"
                  value={formData.city}
                  onChangeText={(text) => setFormData({ ...formData, city: text })}
                  editable={!saving}
                />
              </View>
              <View className="w-28">
                <Input
                  label="State"
                  placeholder="CA"
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text.toUpperCase() })}
                  maxLength={2}
                  editable={!saving}
                />
              </View>
            </View>
          </View>

          {/* ZIP Code */}
          <View className="mb-8">
            <Input
              label="ZIP Code"
              placeholder="94102"
              value={formData.zipCode}
              onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
              keyboardType="numeric"
              editable={!saving}
            />
          </View>

          {/* Save Button */}
          <Button
            onPress={handleSaveAddress}
            disabled={saving}
            className="w-full">
            {saving ? (
              <View className="flex-row items-center justify-center">
                <View className="mr-2">
                  <ActivityIndicator size="small" color="#fff" />
                </View>
                <Text className="text-white font-semibold">Saving...</Text>
              </View>
            ) : (
              <Text className="text-white font-semibold">
                {editingAddress ? 'Update Address' : 'Save Address'}
              </Text>
            )}
          </Button>
        </ScrollView>
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          if (!saving) {
            setShowDeleteDialog(open);
            if (!open) {
              setDeleteAddressId(null);
            }
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onPress={() => {
                setShowDeleteDialog(false);
                setDeleteAddressId(null);
              }}
              disabled={saving}
              className="mr-2">
              <Text className="font-semibold">Cancel</Text>
            </Button>
            <Button
              onPress={confirmDeleteAddress}
              disabled={saving}
              className="bg-red-600">
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Delete</Text>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Success</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onPress={() => setShowSuccessDialog(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{dialogMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onPress={() => setShowErrorDialog(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </View>
  );
}
