import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { addressesApi, type CreateAddressRequest, type UpdateAddressRequest } from '@/lib/api/addresses';
import { locationsApi, type Country, type State } from '@/lib/api/locations';
import { useProfile } from '@/lib/hooks/use-profile';
import type { Address } from '../types';

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, refetch: refetchProfile } = useProfile();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null);
  const [dialogMessage, setDialogMessage] = useState('');
  
  // State/Country selection states
  const [showStateSelect, setShowStateSelect] = useState(false);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  
  const [formData, setFormData] = useState<{
    street: string;
    city: string;
    stateId: number | null;
    zipCode: string;
    countryId: number | null;
    latitude?: number;
    longitude?: number;
    type: 'home' | 'work' | 'other';
  }>({
    street: '',
    city: '',
    stateId: null,
    zipCode: '',
    countryId: null,
    type: 'home'
  });

  // Fetch addresses
  const { data: addresses = [], isLoading: loading, refetch: refetchAddresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.getAddresses(),
    staleTime: 30000,
  });

  // Fetch all countries
  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: ['countries'],
    queryFn: () => locationsApi.getCountries(),
    staleTime: 60000 * 60, // Cache for 1 hour
  });

  // Fetch states for selected country
  const { data: states = [], isLoading: loadingStates } = useQuery({
    queryKey: ['states', selectedCountry?.id],
    queryFn: () => locationsApi.getStatesByCountry(selectedCountry!.id),
    enabled: !!selectedCountry?.id,
    staleTime: 60000 * 60, // Cache for 1 hour
  });

  // Create address mutation
  const createAddressMutation = useMutation({
    mutationFn: (data: CreateAddressRequest) => addressesApi.createAddress(data),
    onSuccess: () => {
      console.log('Address added successfully');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refetchProfile();
      setDialogMessage('Address added successfully');
      setShowSuccessDialog(true);
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      setDialogMessage(error?.message || 'Failed to add address');
      setShowErrorDialog(true);
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAddressRequest }) => 
      addressesApi.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refetchProfile();
      setDialogMessage('Address updated successfully');
      setShowSuccessDialog(true);
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: any) => {
      setDialogMessage(error?.message || 'Failed to update address');
      setShowErrorDialog(true);
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (id: number) => addressesApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refetchProfile();
      setDialogMessage('Address deleted successfully');
      setShowSuccessDialog(true);
    },
    onError: (error: any) => {
      setDialogMessage(error?.message || 'Failed to delete address');
      setShowErrorDialog(true);
    },
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id: number) => addressesApi.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      refetchProfile();
      setDialogMessage('Default address updated');
      setShowSuccessDialog(true);
    },
    onError: (error: any) => {
      setDialogMessage(error?.message || 'Failed to set default address');
      setShowErrorDialog(true);
    },
  });

  const saving = createAddressMutation.isPending || updateAddressMutation.isPending || 
                 deleteAddressMutation.isPending || setDefaultMutation.isPending;

  const resetForm = () => {
    setFormData({
      street: '',
      city: '',
      stateId: null,
      zipCode: '',
      countryId: null,
      type: 'home'
    });
    setSelectedState(null);
    setSelectedCountry(null);
    setEditingAddress(null);
  };

  const handleAddAddress = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEditAddress = (address: Address) => {
    setFormData({
      street: address.street,
      city: address.city,
      stateId: address.stateId ?? null,
      zipCode: address.zipCode ?? '',
      countryId: address.countryId ?? null,
      latitude: address.latitude,
      longitude: address.longitude,
      type: address.type || 'home',
    });
    setSelectedCountry(
      address.country
        ? { id: address.country.id, name: address.country.name }
        : null
    );
    setSelectedState(
      address.state
        ? { id: address.state.id, name: address.state.name, countryId: address.countryId }
        : null
    );
    setEditingAddress(address);
    setShowAddForm(true);
  };

  const handleSaveAddress = async () => {
    if (!formData.street || !formData.city || !formData.stateId || 
        !formData.zipCode || !formData.countryId) {
      setDialogMessage('Please fill in all required fields including state and country.');
      setShowErrorDialog(true);
      return;
    }

    const addressData = {
      street: formData.street,
      city: formData.city,
      stateId: formData.stateId,
      zipCode: formData.zipCode,
      countryId: formData.countryId,
      latitude: formData.latitude,
      longitude: formData.longitude,
      type: formData.type,
    };

    if (editingAddress) {
      updateAddressMutation.mutate({
        id: Number(editingAddress.id),
        data: addressData
      });
    } else {
      createAddressMutation.mutate(addressData as CreateAddressRequest);
    }
  };

  const handleDeleteAddress = (id: number) => {
    setDeleteAddressId(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAddress = () => {
    if (deleteAddressId) {
      deleteAddressMutation.mutate(deleteAddressId);
      setShowDeleteDialog(false);
      setDeleteAddressId(null);
    }
  };

  const handleSetDefault = (id: number) => {
    setDefaultMutation.mutate(id);
  };

  const handleSelectState = (state: State) => {
    setSelectedState(state);
    setFormData((prev) => ({ ...prev, stateId: state.id }));
    setShowStateSelect(false);
  };

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    // Clear state selection when country changes
    setSelectedState(null);
    setFormData({ ...formData, countryId: country.id, stateId: null });
    setShowCountrySelect(false);
  };

  const getAddressIcon = (type: string): string => {
    switch (type) {
      case 'home':
        return 'house';
      case 'work':
        return 'briefcase';
      default:
        return 'location';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <Pressable onPress={() => router.back()} className="mr-3">
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </Pressable>
        <Text className="text-xl font-bold flex-1">Delivery Addresses</Text>
        <Pressable onPress={handleAddAddress} disabled={saving}>
          <IconSymbol name="plus" size={24} color={saving ? "#999" : "#15785B"} />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 px-4 py-6">
          <Skeleton className="w-full h-32 mb-4" />
          <Skeleton className="w-full h-32 mb-4" />
          <Skeleton className="w-full h-32 mb-4" />
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}
          showsVerticalScrollIndicator={false}>
          <View className="gap-4">
            {addresses.map((address) => (
              <View
                key={address.id}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
                      <IconSymbol
                        name={getAddressIcon(address.type)}
                        size={24}
                        color="#15785B"
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center flex-wrap">
                        <Text className="font-semibold text-base text-gray-900 capitalize">{address.type}</Text>
                        {address.isDefault && (
                          <View className="ml-2 bg-green-100 px-2 py-1 rounded-full">
                            <Text className="text-green-800 text-xs font-medium">Default</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-gray-600 mt-1 text-sm leading-5">
                        {address.street}, {address.city}, {address.state?.name || ''} {address.zipCode}
                      </Text>
                      {address.country && (
                        <Text className="text-gray-500 text-xs mt-1">{address.country.name}</Text>
                      )}
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
                      onPress={() => handleDeleteAddress(Number(address.id))}
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
                    onPress={() => handleSetDefault(Number(address.id))}
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
          style={{ flex: 1, maxHeight: SCREEN_HEIGHT * 0.65 }}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 40,
            flexGrow: 1
          }}
          showsVerticalScrollIndicator={true}
          bounces={true}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}>

          {/* Address Type Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-900 mb-3">Address Type</Text>
            <View className="flex-row gap-3">
              {(['home', 'work', 'other'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => !saving && setFormData((prev) => ({ ...prev, type }))}
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

          {/* Country Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-900 mb-2">Country *</Text>
            <Pressable
              onPress={() => !saving && setShowCountrySelect(true)}
              disabled={saving}
              className={`flex-row items-center justify-between px-4 py-3 border-2 rounded-xl ${selectedCountry ? 'border-primary bg-primary/5' : 'border-gray-300 bg-white'
                } ${saving ? 'opacity-50' : ''}`}>
              <Text className={selectedCountry ? 'text-gray-900' : 'text-gray-400'}>
                {selectedCountry ? selectedCountry.name : 'Select country'}
              </Text>
              <IconSymbol name="chevron.down" size={18} color="#666" />
            </Pressable>
          </View>

          {/* State Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-900 mb-2">State *</Text>
            <Pressable
              onPress={() => !saving && !selectedCountry ? null : setShowStateSelect(true)}
              disabled={saving || !selectedCountry}
              className={`flex-row items-center justify-between px-4 py-3 border-2 rounded-xl ${
                !selectedCountry
                  ? 'border-gray-200 bg-gray-50'
                  : selectedState
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 bg-white'
                } ${saving ? 'opacity-50' : ''}`}>
              <Text className={!selectedCountry ? 'text-gray-400' : selectedState ? 'text-gray-900' : 'text-gray-400'}>
                {!selectedCountry ? 'Select country first' : selectedState ? selectedState.name : 'Select state'}
              </Text>
              <IconSymbol name="chevron.down" size={18} color="#666" />
            </Pressable>
          </View>

          {/* Street Address */}
          <View className="mb-6">
            <Input
              label="Street Address"
              placeholder="123 Main Street"
              value={formData.street}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, street: text }))}
              editable={!saving}
            />
          </View>

          {/* City */}
          <View className="mb-6">
            <Input
              label="City"
              placeholder="San Francisco"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              editable={!saving}
            />
          </View>

          {/* Country Selection */}
          {/* <View className="mb-6">
            <Text className="text-sm font-medium text-gray-900 mb-2">Country *</Text>
            <Pressable
              onPress={() => !saving && setShowCountrySelect(true)}
              disabled={saving}
              className={`flex-row items-center justify-between px-4 py-3 border-2 rounded-xl ${selectedCountry ? 'border-primary bg-primary/5' : 'border-gray-300 bg-white'
                } ${saving ? 'opacity-50' : ''}`}>
              <Text className={selectedCountry ? 'text-gray-900' : 'text-gray-400'}>
                {selectedCountry ? selectedCountry.name : 'Select country'}
              </Text>
              <IconSymbol name="chevron.down" size={18} color="#666" />
            </Pressable>
          </View> */}

          {/* ZIP Code */}
          <View className="mb-8">
            <Input
              label="ZIP Code"
              placeholder="94102"
              value={formData.zipCode}
              onChangeText={(text) => setFormData((prev) => ({ ...prev, zipCode: text }))}
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

      {/* State Select Bottom Sheet */}
      <BottomSheet
        visible={showStateSelect}
        onClose={() => setShowStateSelect(false)}
        title="Select State">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24 }}>
          {loadingStates ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#15785B" />
            </View>
          ) : states.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500 text-center">No states found for this country</Text>
            </View>
          ) : (
            <ScrollView 
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {states.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectState(item)}
                  className="py-4 px-4 border-b border-gray-200 bg-white rounded-lg mb-2">
                  <Text className="text-gray-900 text-base">{item.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </BottomSheet>

      {/* Country Select Bottom Sheet */}
      <BottomSheet
        visible={showCountrySelect}
        onClose={() => setShowCountrySelect(false)}
        title="Select Country">
        <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24 }}>
          {loadingCountries ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#15785B" />
            </View>
          ) : countries.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500 text-center">No countries available</Text>
            </View>
          ) : (
            <ScrollView 
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              bounces={true}
            >
              {countries.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectCountry(item)}
                  className="py-4 px-4 border-b border-gray-200 bg-white rounded-lg mb-2">
                  <Text className="text-gray-900 text-base">{item.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
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
