import { atom } from 'jotai'
import type { LocationObject } from 'expo-location'

export type UserLocation = {
  coords: {
    latitude: number
    longitude: number
  }
  address?: string
  timestamp: number
} | null

export const locationAtom = atom<UserLocation>(null)

export const addressAtom = atom<string | null>(null)

