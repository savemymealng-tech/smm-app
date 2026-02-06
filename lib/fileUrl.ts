/**
 * Utility functions for handling file URLs
 * Converts localhost URLs to network IP for React Native compatibility
 */

import { Platform } from 'react-native';

/**
 * Get the network IP address to replace localhost
 * This ensures images work on physical devices and emulators
 */
const getNetworkIp = (): string => {
  // For Android emulator: 10.0.2.2 accesses host machine
  // For development, use your actual network IP
  if (Platform.OS === 'android') {
    return '192.168.1.157'; // Should match the IP in config.ts
  }
  return 'localhost';
};

/**
 * Convert localhost URLs to network IP URLs
 * @param url - The URL to process
 * @returns Processed URL with localhost replaced by network IP
 */
export const getFileUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;

  // If it's a relative path, return as is (might need base URL prepending)
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return url;
  }

  // Replace localhost with network IP for React Native
  if (url.includes('localhost') || url.includes('127.0.0.1')) {
    const networkIp = getNetworkIp();
    return url
      .replace('localhost', networkIp)
      .replace('127.0.0.1', networkIp);
  }

  // Return URL as is if no replacement needed
  return url;
};

/**
 * Get base URL from environment or construct it
 * @returns Base URL for file serving
 */
export const getBaseUrl = (): string => {
  if (__DEV__) {
    const networkIp = getNetworkIp();
    const port = process.env.EXPO_PUBLIC_FILE_PORT || '6001';
    return `http://${networkIp}:${port}`;
  }
  return process.env.EXPO_PUBLIC_FILE_BASE_URL || 'https://app.savemymeal.com';
};

/**
 * Convert relative path to full URL
 * @param path - Relative file path
 * @returns Full URL or null
 */
export const getFullUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;

  // If already a full URL, process it through getFileUrl
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return getFileUrl(path);
  }

  // Otherwise prepend base URL
  const baseUrl = getBaseUrl();
  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return getFileUrl(`${baseUrl}${cleanPath}`);
};

/**
 * Transform an object's file path properties to full URLs
 * @param obj - Object containing file paths
 * @param fields - Array of field names that contain file paths
 * @returns Object with full URLs
 */
export const transformUrlFields = <T extends Record<string, any>>(
  obj: T | null | undefined,
  fields: (keyof T)[]
): T | null => {
  if (!obj) return null;

  const transformed = { ...obj };
  fields.forEach((field) => {
    if (transformed[field]) {
      transformed[field] = getFullUrl(transformed[field] as string) as any;
    }
  });

  return transformed;
};

/**
 * Get image source object for React Native Image component
 * @param uri - Image URI (can be relative or absolute)
 * @param fallback - Optional fallback image URI
 * @returns Image source object with uri
 */
export const getImageSource = (
  uri: string | null | undefined,
  fallback?: string
): { uri: string } | undefined => {
  const processedUri = getFullUrl(uri);
  
  if (processedUri) {
    return { uri: processedUri };
  }

  if (fallback) {
    return { uri: getFullUrl(fallback) || fallback };
  }

  return undefined;
};
