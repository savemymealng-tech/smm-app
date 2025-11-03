import { atom } from 'jotai'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ThemeMode = 'light' | 'dark' | 'automatic'

const STORAGE_KEY = 'app_theme'

export const themeAtom = atom<ThemeMode>('automatic')

export const persistThemeAtom = atom(
  (get) => get(themeAtom),
  async (get, set, update: ThemeMode | ((prev: ThemeMode) => ThemeMode)) => {
    const newTheme = typeof update === 'function' ? update(get(themeAtom)) : update

    await AsyncStorage.setItem(STORAGE_KEY, newTheme)
    set(themeAtom, newTheme)
  }
)

export const initThemeAtom = atom(null, async (get, set) => {
  try {
    const storedTheme = await AsyncStorage.getItem(STORAGE_KEY)
    if (storedTheme) {
      set(themeAtom, storedTheme as ThemeMode)
    }
  } catch (error) {
    console.error('Error initializing theme:', error)
  }
})

