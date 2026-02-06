import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { toast } from '@/components/ui/toast';
import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

interface LocationResult {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  street?: string;
  postalCode?: string;
}

interface LocationPickerProps {
  onLocationSelected: (location: LocationResult) => void;
  initialLocation?: { latitude: number; longitude: number };
}

export function LocationPicker({ onLocationSelected, initialLocation }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGettingCurrent, setIsGettingCurrent] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);

  const handleUseCurrentLocation = async () => {
    setIsGettingCurrent(true);
    try {
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        toast.error('Permission Denied', 'We need location permission to get your current location');
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      if (addresses.length > 0) {
        const address = addresses[0];
        const locationResult: LocationResult = {
          address: `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim(),
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          city: address.city || undefined,
          street: address.street || undefined,
          postalCode: address.postalCode || undefined,
        };

        onLocationSelected(locationResult);
        toast.success('Location Found', 'Your current location has been set');
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      toast.error('Error', 'Failed to get your current location');
    } finally {
      setIsGettingCurrent(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.warning('Enter Location', 'Please enter a location to search');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);

    try {
      // Geocode the search query
      const results = await Location.geocodeAsync(searchQuery);

      if (results.length === 0) {
        toast.info('No Results', 'No locations found for your search');
        return;
      }

      // Reverse geocode each result to get full address
      const locationResults: LocationResult[] = [];
      
      for (const result of results.slice(0, 5)) { // Limit to 5 results
        try {
          const addresses = await Location.reverseGeocodeAsync({
            latitude: result.latitude,
            longitude: result.longitude,
          });

          if (addresses.length > 0) {
            const address = addresses[0];
            locationResults.push({
              address: `${address.street || ''}, ${address.city || ''}, ${address.region || ''}, ${address.country || ''}`.trim(),
              latitude: result.latitude,
              longitude: result.longitude,
              city: address.city || undefined,
              street: address.street || undefined,
              postalCode: address.postalCode || undefined,
            });
          }
        } catch (err) {
          console.error('Error reverse geocoding:', err);
        }
      }

      setSearchResults(locationResults);

      if (locationResults.length === 0) {
        toast.info('No Results', 'Could not find detailed information for these locations');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      toast.error('Search Failed', 'Failed to search for location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectLocation = (location: LocationResult) => {
    onLocationSelected(location);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <View className="bg-white rounded-2xl p-4">
      {/* Current Location Button */}
      <Button
        onPress={handleUseCurrentLocation}
        disabled={isGettingCurrent}
        variant="outline"
        className="mb-4"
      >
        {isGettingCurrent ? (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#15785B" />
            <Text className="ml-2 text-primary">Getting location...</Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <IconSymbol name="location.fill" size={18} color="#15785B" />
            <Text className="ml-2 text-primary font-semibold">Use Current Location</Text>
          </View>
        )}
      </Button>

      {/* Divider */}
      <View className="flex-row items-center my-4">
        <View className="flex-1 h-px bg-gray-200" />
        <Text className="mx-3 text-gray-500 text-sm">OR</Text>
        <View className="flex-1 h-px bg-gray-200" />
      </View>

      {/* Search Input */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-900 mb-2">Search Location</Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1">
            <Input
              placeholder="Enter address, city, or place"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
          </View>
          <Button
            onPress={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            size="lg"
            className="px-6"
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <IconSymbol name="magnifyingglass" size={18} color="white" />
            )}
          </Button>
        </View>
      </View>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <ScrollView className="max-h-80 border border-gray-200 rounded-xl">
          <Text className="text-xs font-semibold text-gray-500 uppercase p-3 bg-gray-50">
            Select a location
          </Text>
          {searchResults.map((location, index) => (
            <Pressable
              key={index}
              onPress={() => handleSelectLocation(location)}
              className="p-4 border-b border-gray-100 active:bg-gray-50"
            >
              <View className="flex-row items-start">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mr-3 mt-0.5">
                  <IconSymbol name="mappin" size={16} color="#15785B" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-medium mb-1">{location.address}</Text>
                  <Text className="text-xs text-gray-500">
                    {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={16} color="#9ca3af" />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Help Text */}
      <View className="mt-4 bg-blue-50 p-3 rounded-xl">
        <View className="flex-row items-start">
          <IconSymbol name="info.circle.fill" size={16} color="#3b82f6" />
          <Text className="flex-1 ml-2 text-xs text-gray-600">
            Search for your exact address or use your current location to set coordinates for accurate delivery
          </Text>
        </View>
      </View>
    </View>
  );
}
