/**
 * Always return light mode - dark mode is disabled
 */
export function useColorScheme() {
  return 'light' as const;
}
