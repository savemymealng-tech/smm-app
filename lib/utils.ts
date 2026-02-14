import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Re-export file URL utilities
export { getBaseUrl, getFileUrl, getFullUrl, getImageSource, transformUrlFields } from './fileUrl'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDistance(distance: number): string {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  }
  return `${(distance / 1000).toFixed(1)}km`
}

export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Determines the effective pickup day based on current time
 * If pickup_day is "today" but the end time has passed, returns "tomorrow"
 * @param pickup_day - The original pickup day ("today" or "tomorrow")
 * @param pickup_end_time - The end time in HH:MM format (24-hour)
 * @returns The effective day to display ("Today" or "Tomorrow")
 */
export function getEffectivePickupDay(
  pickup_day?: 'today' | 'tomorrow',
  pickup_end_time?: string
): string {
  if (!pickup_day || !pickup_end_time) {
    return pickup_day === 'tomorrow' ? 'Tomorrow' : 'Today';
  }

  // If already set to tomorrow, no need to check
  if (pickup_day === 'tomorrow') {
    return 'Tomorrow';
  }

  // Parse the end time
  const [hours, minutes] = pickup_end_time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) {
    return 'Today';
  }

  // Get current time
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  // Convert to minutes since midnight for easy comparison
  const endTimeMinutes = hours * 60 + minutes;
  const currentTimeMinutes = currentHours * 60 + currentMinutes;

  // If current time is past the end time, show as tomorrow
  if (currentTimeMinutes >= endTimeMinutes) {
    return 'Tomorrow';
  }

  return 'Today';
}

