import { atom } from 'jotai'
import type { User } from '../../../types'
import * as SecureStore from 'expo-secure-store'

export type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export const authAtom = atom<AuthState>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
})

const STORAGE_KEY = 'auth_user'

export const persistAuthAtom = atom(
  (get) => get(authAtom),
  async (get, set, update: AuthState | ((prev: AuthState) => AuthState)) => {
    const newState = typeof update === 'function' ? update(get(authAtom)) : update

    if (newState.user) {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(newState.user))
    } else {
      await SecureStore.deleteItemAsync(STORAGE_KEY)
    }

    set(authAtom, newState)
  }
)

export const initAuthAtom = atom(null, async (get, set) => {
  try {
    const storedUser = await SecureStore.getItemAsync(STORAGE_KEY)
    if (storedUser) {
      const user = JSON.parse(storedUser)
      set(authAtom, {
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      set(authAtom, {
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  } catch (error) {
    console.error('Error initializing auth:', error)
    set(authAtom, {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }
})

