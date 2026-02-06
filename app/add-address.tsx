import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { LocationPicker } from '@/components/ui/location-picker';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import { addressesApi, type CreateAddressRequest } from '@/lib/api/addresses';
import { locationsApi, type Country, type State } from '@/lib/api/locations';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const getAddressIcon = (type: string) => {
  switch (type) {
    case 'home': return 'house.fill';
    case 'work': return 'briefcase.fill';
    case 'other': return 'mappin.circle.fill';
    default: return 'mappin.circle.fill';
  }
};

export default function AddAddressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ addressId?: string }>();
  const isEditing = !!params.addressId;

  const [showStateSelect, setShowStateSelect] = useState(false);
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const [formData, setFormData] = useState({
    label: '',
    street: '',
    city: '',
    stateId: null as number | null,
    zipCode: '',
    countryId: null as number | null,
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    type: 'home' as 'home' | 'work' | 'other',
  });

  // Fetch countries
  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: ['countries'],
    queryFn: () => locationsApi.getCountries(),
    staleTime: 60000 * 60,
  });

  // Fetch existing address if editing
  const { data: existingAddress, isLoading: loadingAddress } = useQuery({
    queryKey: ['address', params.addressId],
    queryFn: () => addressesApi.getAddress(Number(params.addressId)),
    enabled: isEditing && !!params.addressId,
  });

  // Populate form when existing address is loaded
  useEffect(() => {
    if (existingAddress) {
      setFormData({
        label: existingAddress.label || '',
        street: existingAddress.street || '',
        city: existingAddress.city || '',
        stateId: existingAddress.stateId || null,
        zipCode: existingAddress.zipCode || '',
        countryId: existingAddress.countryId || null,
        latitude: existingAddress.latitude,
        longitude: existingAddress.longitude,
        type: existingAddress.type || 'home',
      });

      // Set selected country and state
      if (existingAddress.country) {
        setSelectedCountry(existingAddress.country as Country);
      }
      if (existingAddress.state) {
        setSelectedState(existingAddress.state as State);
      }
    }
  }, [existingAddress]);

  // Fetch states for selected country
  const { data: states = [], isLoading: loadingStates } = useQuery({
    queryKey: ['states', selectedCountry?.id],
    queryFn: () => locationsApi.getStatesByCountry(selectedCountry!.id),
    enabled: !!selectedCountry?.id,
    staleTime: 60000 * 60,
  });

  // Create/Update mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateAddressRequest) => addressesApi.createAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Success', 'Address saved successfully');
      router.back();
    },
    onError: (error: any) => {
      toast.error('Error', error?.message || 'Failed to save address');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; data: any }) => 
      addressesApi.updateAddress(data.id, data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      toast.success('Success', 'Address updated successfully');
      router.back();
    },
    onError: (error: any) => {
      toast.error('Error', error?.message || 'Failed to update address');
    },
  });

  const handleSelectState = (state: State) => {
    setSelectedState(state);
    setFormData({ ...formData, stateId: state.id });
    setShowStateSelect(false);
  };

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setFormData({ ...formData, countryId: country.id, stateId: null });
    setSelectedState(null);
    setShowCountrySelect(false);
  };

  const handleSave = () => {
    if (!formData.label || !formData.street || !formData.city || !formData.stateId || 
        !formData.zipCode || !formData.countryId) {
      toast.error('Missing Fields', 'Please fill in all required fields');
      return;
    }

    const addressData = {
      label: formData.label,
      street: formData.street,
      city: formData.city,
      stateId: formData.stateId,
      zipCode: formData.zipCode,
      countryId: formData.countryId,
      latitude: formData.latitude,
      longitude: formData.longitude,
      type: formData.type,
    };

    if (isEditing && params.addressId) {
      updateMutation.mutate({ id: Number(params.addressId), data: addressData });
    } else {
      createMutation.mutate(addressData as CreateAddressRequest);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  // Show loading state while fetching address data
  if (isEditing && loadingAddress) {
    return (
      <View className="flex-1 bg-white items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#15785B" />
        <Text className="text-gray-500 mt-4">Loading address...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      {/* <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center"
        >
          <IconSymbol name="arrow.back" size={24} color="#000" />
        </Pressable>
        <Text className="text-xl font-bold text-gray-900">
          {isEditing ? 'Edit Address' : 'Add Address'}
        </Text>
        <View className="w-10" />
      </View> */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}
      >
        {/* Label Input */}
        <View className="mb-6 mt-6">
          <Input
            label="Label"
            placeholder="Home, Work, etc."
            value={formData.label}
            onChangeText={(text) => setFormData({ ...formData, label: text })}
            editable={!isLoading}
          />
        </View>

        {/* Address Type Selection */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-900 mb-3">Address Type</Text>
          <View className="flex-row gap-3">
            {(['home', 'work', 'other'] as const).map((type) => (
              <Pressable
                key={type}
                onPress={() => !isLoading && setFormData({ ...formData, type })}
                disabled={isLoading}
                className={`flex-1 p-4 rounded-xl border-2 ${
                  formData.type === type
                    ? 'border-primary bg-primary/10'
                    : 'border-gray-200 bg-white'
                } ${isLoading ? 'opacity-50' : ''}`}
              >
                <View className="items-center">
                  <IconSymbol
                    name={getAddressIcon(type)}
                    size={28}
                    color={formData.type === type ? '#15785B' : '#666'}
                  />
                  <Text
                    className={`mt-2 capitalize text-sm font-medium ${
                      formData.type === type ? 'text-primary' : 'text-gray-600'
                    }`}
                  >
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
            onPress={() => !isLoading && setShowCountrySelect(true)}
            disabled={isLoading}
            className={`flex-row items-center justify-between px-4 py-3 border-2 rounded-xl ${
              selectedCountry ? 'border-primary bg-primary/5' : 'border-gray-300 bg-white'
            } ${isLoading ? 'opacity-50' : ''}`}
          >
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
            onPress={() => selectedCountry && !isLoading && setShowStateSelect(true)}
            disabled={isLoading || !selectedCountry}
            className={`flex-row items-center justify-between px-4 py-3 border-2 rounded-xl ${
              !selectedCountry
                ? 'border-gray-200 bg-gray-50'
                : selectedState
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 bg-white'
            } ${isLoading ? 'opacity-50' : ''}`}
          >
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
            onChangeText={(text) => setFormData({ ...formData, street: text })}
            editable={!isLoading}
          />
        </View>

        {/* City */}
        <View className="mb-6">
          <Input
            label="City"
            placeholder="San Francisco"
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
            editable={!isLoading}
          />
        </View>

        {/* ZIP Code */}
        <View className="mb-8">
          <Input
            label="ZIP Code"
            placeholder="94102"
            value={formData.zipCode}
            onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
            keyboardType="numeric"
            editable={!isLoading}
          />
        </View>

        {/* Location Picker */}
        <View className="mb-8">
          <Text className="text-sm font-medium text-gray-900 mb-3">
            Location Coordinates {formData.latitude && formData.longitude && '✓'}
          </Text>
          <LocationPicker
            onLocationSelected={(location) => {
              setFormData({
                ...formData,
                latitude: location.latitude,
                longitude: location.longitude,
                // Auto-fill city and street if not already filled
                city: formData.city || location.city || formData.city,
                street: formData.street || location.street || formData.street,
              });
            }}
            initialLocation={
              formData.latitude && formData.longitude
                ? { latitude: formData.latitude, longitude: formData.longitude }
                : undefined
            }
          />
          {formData.latitude && formData.longitude && (
            <View className="mt-3 p-3 bg-green-50 rounded-xl">
              <View className="flex-row items-center">
                <IconSymbol name="checkmark.circle.fill" size={16} color="#10b981" />
                <Text className="ml-2 text-sm text-gray-700">
                  Location set: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Save Button */}
        <Button onPress={handleSave} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">
              {isEditing ? 'Update Address' : 'Save Address'}
            </Text>
          )}
        </Button>
      </ScrollView>

      {/* State Select Bottom Sheet */}
      <BottomSheet
        visible={showStateSelect}
        onClose={() => setShowStateSelect(false)}
        title="Select State"
      >
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
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} bounces={true}>
              {states.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectState(item)}
                  className="py-4 px-4 border-b border-gray-200 bg-white rounded-lg mb-2"
                >
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
        title="Select Country"
      >
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
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} bounces={true}>
              {countries.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSelectCountry(item)}
                  className="py-4 px-4 border-b border-gray-200 bg-white rounded-lg mb-2"
                >
                  <Text className="text-gray-900 text-base">{item.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </BottomSheet>
    </View>
  );
}
