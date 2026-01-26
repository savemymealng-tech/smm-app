/**
 * useLocation Hook
 * Handles location permissions and GPS coordinate tracking
 */

import { toast } from '@/components/ui/toast';
import * as Location from 'expo-location';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { locationAtom, type UserLocation } from '../atoms/location';

export type LocationPermissionStatus = 
  | 'undetermined' 
  | 'granted' 
  | 'denied' 
  | 'restricted';

export interface UseLocationReturn {
  /** Current user location */
  location: UserLocation;
  /** Whether location is currently being fetched */
  isLoading: boolean;
  /** Error message if location fetch failed */
  error: string | null;
  /** Current permission status */
  permissionStatus: LocationPermissionStatus;
  /** Request location permission and get current location */
  requestLocation: () => Promise<void>;
  /** Refresh location (re-fetch current position) */
  refreshLocation: () => Promise<void>;
  /** Open device settings for location permissions */
  openSettings: () => Promise<void>;
}

/**
 * Hook to manage user location with permission handling
 * @param autoRequest - Whether to automatically request location on mount (default: true)
 */
export function useLocation(autoRequest: boolean = true): UseLocationReturn {
  const [location, setLocation] = useAtom(locationAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('undetermined');

  /**
   * Check current permission status
   */
  const checkPermission = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const mappedStatus: LocationPermissionStatus = 
        status === Location.PermissionStatus.GRANTED ? 'granted' :
        status === Location.PermissionStatus.DENIED ? 'denied' :
        'undetermined';
      
      setPermissionStatus(mappedStatus);
      return mappedStatus;
    } catch (err) {
      console.error('Error checking location permission:', err);
      return 'undetermined';
    }
  }, []);

  /**
   * Request location permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      const mappedStatus: LocationPermissionStatus = 
        status === Location.PermissionStatus.GRANTED ? 'granted' :
        status === Location.PermissionStatus.DENIED ? 'denied' :
        'undetermined';
      
      setPermissionStatus(mappedStatus);
      
      if (status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission denied');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      setError('Failed to request location permission');
      return false;
    }
  }, []);

  /**
   * Get current position
   */
  const getCurrentPosition = useCallback(async (): Promise<UserLocation | null> => {
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const userLocation: UserLocation = {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        timestamp: position.timestamp,
      };

      // Try to get address (reverse geocoding)
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        if (address) {
          const addressParts = [
            address.street,
            address.city,
            address.region,
          ].filter(Boolean);
          
          userLocation.address = addressParts.join(', ');
        }
      } catch (geocodeErr) {
        // Reverse geocoding is optional, don't fail if it doesn't work
        console.log('Reverse geocoding failed:', geocodeErr);
      }

      return userLocation;
    } catch (err: any) {
      console.error('Error getting current position:', err);
      throw new Error(err.message || 'Failed to get current location');
    }
  }, []);

  /**
   * Request location permission and get current location
   */
  const requestLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check/request permission
      const currentStatus = await checkPermission();
      
      if (currentStatus === 'denied') {
        // Permission was previously denied, show toast and offer to open settings
        toast.warning(
          'Location Permission Required',
          'Tap to open settings and enable location access'
        );
        // Auto-open settings for convenience
        openSettings();
        setIsLoading(false);
        return;
      }

      if (currentStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setIsLoading(false);
          return;
        }
      }

      // Get current position
      const userLocation = await getCurrentPosition();
      
      if (userLocation) {
        setLocation(userLocation);
        console.log('📍 Location updated:', userLocation.coords);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
      console.error('Location error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [checkPermission, requestPermission, getCurrentPosition, setLocation]);

  /**
   * Refresh location (re-fetch current position)
   */
  const refreshLocation = useCallback(async () => {
    if (permissionStatus !== 'granted') {
      await requestLocation();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userLocation = await getCurrentPosition();
      
      if (userLocation) {
        setLocation(userLocation);
        console.log('📍 Location refreshed:', userLocation.coords);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh location');
    } finally {
      setIsLoading(false);
    }
  }, [permissionStatus, requestLocation, getCurrentPosition, setLocation]);

  /**
   * Open device settings for location permissions
   */
  const openSettings = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (err) {
      console.error('Failed to open settings:', err);
      toast.error('Error', 'Unable to open settings. Please enable location manually.');
    }
  }, []);

  // Check permission status on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Auto-request location on mount if enabled and no location exists
  useEffect(() => {
    if (autoRequest && !location) {
      requestLocation();
    }
  }, [autoRequest]); // Only run on mount

  return {
    location,
    isLoading,
    error,
    permissionStatus,
    requestLocation,
    refreshLocation,
    openSettings,
  };
}

export default useLocation;
