import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type LocationPermissionStatus =
  | 'undetermined'
  | 'granted'
  | 'denied'
  | 'restricted';

// Share an in-progress permission request across screens and the address picker.
let permissionRequest: ReturnType<
  typeof Location.requestForegroundPermissionsAsync
> | null = null;

export async function getLocationAccess(allowPrompt = false) {
  let permission = await Location.getForegroundPermissionsAsync();
  let servicesEnabled = await Location.hasServicesEnabledAsync();
  if (allowPrompt && !servicesEnabled && Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
    } catch {
      /* User may decline the system dialog. */
    }
    servicesEnabled = await Location.hasServicesEnabledAsync();
  }
  if (
    servicesEnabled &&
    allowPrompt &&
    permission.status !== 'granted' &&
    permission.status !== ('restricted' as string) &&
    permission.canAskAgain
  ) {
    permissionRequest ??= Location.requestForegroundPermissionsAsync();
    try {
      permission = await permissionRequest;
    } finally {
      permissionRequest = null;
    }
  }
  // Permanent denial/restriction stays non-prompting; automatic checks never ask.
  const status = permission.status as LocationPermissionStatus;
  return {
    status,
    available: servicesEnabled && status === 'granted',
    message: !servicesEnabled
      ? 'Location Services are off. Turn them on in Settings, or choose a browsing area.'
      : 'Location is optional. Enable it in Settings to automatically find nearby vendors, or continue without it.',
  };
}

export function withLocationTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Location request timed out')),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
export async function getPositionForBrowsing(
  allowPrompt = false,
  timeoutMs = 15000,
) {
  try {
    return await withLocationTimeout(
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: allowPrompt,
      }),
      timeoutMs,
    );
  } catch (error) {
    try {
      const last = await withLocationTimeout(
        Location.getLastKnownPositionAsync({
          maxAge: 120000,
          requiredAccuracy: 500,
        }),
        2000,
      );
      if (
        last &&
        Date.now() - last.timestamp <= 120000 &&
        last.timestamp <= Date.now() &&
        last.coords.accuracy != null &&
        last.coords.accuracy <= 500
      )
        return last;
    } catch {
      /* No usable recent position. */
    }
    throw error;
  }
}
