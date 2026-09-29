import * as Location from 'expo-location';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied' | 'restricted';

// Share an in-progress permission request across screens and the address picker.
let permissionRequest: ReturnType<typeof Location.requestForegroundPermissionsAsync> | null = null;

export async function getLocationAccess(allowPrompt = false) {
  let permission = await Location.getForegroundPermissionsAsync();
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (servicesEnabled && allowPrompt && permission.status === 'undetermined' && permission.canAskAgain) {
    permissionRequest ??= Location.requestForegroundPermissionsAsync();
    try {
      permission = await permissionRequest;
    } finally {
      permissionRequest = null;
    }
  }
  // Expo maps iOS restricted authorization to denied. Both are non-prompting.
  const status = permission.status as LocationPermissionStatus;
  return {
    status,
    available: servicesEnabled && status === 'granted',
    message: !servicesEnabled
      ? 'Location Services are off. You can continue browsing or enter an address manually.'
      : 'Location is optional. Enable it in Settings to automatically find nearby vendors, or continue without it.',
  };
}
