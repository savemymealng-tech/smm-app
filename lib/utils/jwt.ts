/**
 * JWT Token Utilities
 * Helper functions for handling JWT tokens
 */

interface JWTPayload {
  exp?: number;
  iat?: number;
  [key: string]: any;
}

/**
 * Decode JWT token without verification
 * Note: This is for client-side expiration checking only
 * Server should always validate tokens
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=');
    
    // Decode base64url
    const decoded = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string | null): boolean {
  if (!token) return true;

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}

/**
 * Check if token is expiring soon (within specified minutes)
 * @param token - JWT token
 * @param minutesThreshold - Minutes before expiration to consider "expiring soon"
 */
export function isTokenExpiringSoon(token: string | null, minutesThreshold: number = 10): boolean {
  if (!token) return true;

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const expirationTime = payload.exp;
  const timeUntilExpiration = expirationTime - currentTime;

  // Convert minutes to seconds
  const thresholdSeconds = minutesThreshold * 60;

  return timeUntilExpiration <= thresholdSeconds;
}

/**
 * Get time until token expiration in seconds
 */
export function getTimeUntilExpiration(token: string | null): number {
  if (!token) return 0;

  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeUntilExpiration = payload.exp - currentTime;

  return Math.max(0, timeUntilExpiration);
}
