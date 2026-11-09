import { useEffect } from 'react';
import { colorScheme } from 'nativewind';
import { usePreferences } from '@/lib/stores/preferences';

/**
 * Sinkronkan preferensi tema user dengan NativeWind.
 * Panggil SEKALI di RootLayout (app/_layout.tsx).
 *
 * Menunggu `_hasHydrated` sebelum apply agar tidak ada
 * flash theme saat cold start.
 */
export function useThemeSync() {
  const theme = usePreferences((s) => s.theme);
  const hasHydrated = usePreferences((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    colorScheme.set(theme);
  }, [theme, hasHydrated]);
}