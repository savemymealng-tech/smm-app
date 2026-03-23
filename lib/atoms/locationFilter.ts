import { atom } from 'jotai'

/**
 * Location Filter State Management
 * Handles user preferences for location-based filtering
 */

// Whether location filtering is enabled (default: true - "Near Me" is ON by default)
export const useLocationFilterAtom = atom<boolean>(true)

// Search radius in kilometers (default: 10km)
export const locationRadiusAtom = atom<number>(10)
