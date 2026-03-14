import { atom } from 'jotai'
import type { User } from '../../types'
import { authApi } from '../api/auth'
import { tokenManager } from '../api/client'
import { isTokenExpired } from '../utils/jwt'

export type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null
}

export const authAtom = atom<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessToken: null,
  refreshToken: null,
})

const STORAGE_KEY = 'auth_user'

export const persistAuthAtom = atom(
  (get) => get(authAtom),
  async (get, set, update: AuthState | ((prev: AuthState) => AuthState)) => {
    const newState = typeof update === 'function' ? update(get(authAtom)) : update

    // Store user data
    if (newState.user) {
      // User data is stored separately from tokens
      // Tokens are managed by tokenManager in the API client
    } else {
      // Clear tokens when logging out
      await tokenManager.clearTokens()
    }

    set(authAtom, newState)
  }
)

export const initAuthAtom = atom(null, async (get, set) => {
  try {
    const accessToken = await tokenManager.getAccessToken()
    const refreshToken = await tokenManager.getRefreshToken()

    // No refresh token → definitively not logged in
    if (!refreshToken) {
      set(authAtom, {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        accessToken: null,
        refreshToken: null,
      })
      return
    }

    // Has refresh token → user is (or was) logged in.
    // If the access token is missing or expired, refresh it now so the
    // correct auth state is ready before the splash screen hides.
    if (!accessToken || isTokenExpired(accessToken)) {
      try {
        const { token: newToken, refreshToken: newRefreshToken } =
          await authApi.refreshToken(refreshToken)
        set(authAtom, {
          user: null, // fetched lazily via useProfile
          isAuthenticated: true,
          isLoading: false,
          accessToken: newToken,
          refreshToken: newRefreshToken,
        })
      } catch {
        // Refresh token itself expired or revoked → user must log in again
        await tokenManager.clearTokens()
        set(authAtom, {
          user: null,
          isAuthenticated: false,
          isLoading: false,
          accessToken: null,
          refreshToken: null,
        })
      }
    } else {
      // Both tokens present and access token still valid
      set(authAtom, {
        user: null,
        isAuthenticated: true,
        isLoading: false,
        accessToken,
        refreshToken,
      })
    }
  } catch (error) {
    console.error('Error initializing auth:', error)
    set(authAtom, {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,
    })
  }
})

/**
 * Set auth state after successful login/signup
 */
export const setAuthStateAtom = atom(
  null,
  async (get, set, authData: { user: User; accessToken: string; refreshToken?: string }) => {
    await tokenManager.setTokens(authData.accessToken, authData.refreshToken)
    set(authAtom, {
      user: authData.user,
      isAuthenticated: true,
      isLoading: false,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken || null,
    })
  }
)

/**
 * Clear auth state (logout)
 */
export const clearAuthStateAtom = atom(
  null,
  async (get, set) => {
    await tokenManager.clearTokens()
    set(authAtom, {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,
    })
  }
)

/**
 * Update tokens only (for refresh operations)
 */
export const updateTokensAtom = atom(
  null,
  async (get, set, newAccessToken: string, newRefreshToken: string) => {
    const currentAuth = get(authAtom)
    
    // Update tokens in secure storage
    await tokenManager.setTokens(newAccessToken, newRefreshToken)
    
    // Update atom state
    set(authAtom, {
      ...currentAuth,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    })
  }
)

