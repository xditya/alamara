import { useColorScheme as useRNColorScheme } from 'react-native';

import { usePreferences } from '@/lib/theme-store';

/**
 * Effective color scheme: honors the user's in-app theme choice (System / Light /
 * Dark) from the preferences store, falling back to the OS scheme for "system".
 */
export function useColorScheme() {
  const system = useRNColorScheme();
  const { theme } = usePreferences();
  if (theme === 'light') return 'light';
  if (theme === 'dark') return 'dark';
  return system;
}
