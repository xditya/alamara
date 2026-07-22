import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { usePreferences } from '@/lib/theme-store';

/**
 * Effective color scheme on web. Honors the in-app theme choice, and re-calculates
 * on the client after hydration for correct static rendering.
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const system = useRNColorScheme();
  const { theme } = usePreferences();

  if (!hasHydrated) return 'light' as const;
  if (theme === 'light') return 'light' as const;
  if (theme === 'dark') return 'dark' as const;
  return system;
}
