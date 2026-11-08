import * as Location from 'expo-location';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';
import {
  getLocationTrace,
  safeLocationError,
} from './location-diagnostic-trace';
import { withLocationTimeout } from './locationAccess';

/** On-device support report: no coordinates, addresses, tokens, or search history. */
export async function collectLocationDiagnostics() {
  const [permission, providers] = await Promise.allSettled([
    withLocationTimeout(
      Promise.resolve().then(() => Location.getForegroundPermissionsAsync()),
      3000,
    ),
    withLocationTimeout(
      Promise.resolve().then(() => Location.getProviderStatusAsync()),
      3000,
    ),
  ]);
  return {
    report: 'smm-location-v1',
    appVersion: Application.nativeApplicationVersion,
    buildNumber: Application.nativeBuildVersion,
    appId: Application.applicationId,
    platform: Platform.OS,
    osVersion: Platform.Version,
    executionEnvironment: Constants.executionEnvironment,
    appState: AppState.currentState,
    permission:
      permission.status === 'fulfilled'
        ? {
            status: permission.value.status,
            granted: permission.value.granted,
            canAskAgain: permission.value.canAskAgain,
            androidAccuracy: permission.value.android?.accuracy,
          }
        : safeLocationError(permission.reason),
    providers:
      providers.status === 'fulfilled'
        ? {
            locationServicesEnabled: providers.value.locationServicesEnabled,
            gpsAvailable: providers.value.gpsAvailable,
            networkAvailable: providers.value.networkAvailable,
            passiveAvailable: providers.value.passiveAvailable,
          }
        : safeLocationError(providers.reason),
    trace: getLocationTrace(),
  };
}
