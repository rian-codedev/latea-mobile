import '@/global.css';

import { useEffect, useState } from 'react';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';

import { NAV_THEME } from '@/lib/theme/navigation';
import { SessionProvider, useSession } from '@/lib/stores/session';
import { usePreferences } from '@/lib/stores/preferences';
import { useFirstLaunch } from '@/lib/hooks/use-first-launch';
import { useThemeSync } from '@/lib/hooks/use-theme-sync';
import { LoadingSplash } from '@/components/feedback/loading-splash';
import { AuthExpiredToast } from '@/components/feedback/auth-expired-toast';

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: (failureCount, error) => {
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          if (status === 401 || status === 403) return false;
        }
        return failureCount < 1;
      },
    },
  },
});

function RootNavigator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { authExpired, clearAuthExpired } = useSession();

  useThemeSync(); // ⭐ Terapkan tema dari preferensi

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });

  const { isFirstLaunch } = useFirstLaunch();
  const prefsHydrated = usePreferences((s) => s._hasHydrated);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded && isFirstLaunch !== null) {
      SplashScreen.hideAsync();
      const timer = setTimeout(() => setAppReady(true), 1300);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, isFirstLaunch]);

  useEffect(() => {
    if (appReady && isFirstLaunch === true) {
      router.replace('/(onboarding)' as any);
    }
  }, [appReady, isFirstLaunch]);

  // ⭐ Gate: tunggu semua siap termasuk preferensi ter-hydrate
  if (!fontsLoaded || isFirstLaunch === null || !appReady || !prefsHydrated) {
    return <LoadingSplash />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ThemeProvider value={isDark ? NAV_THEME.dark : NAV_THEME.light}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <PortalHost />
      </ThemeProvider>

      <AuthExpiredToast
        visible={authExpired}
        onHide={clearAuthExpired}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </QueryClientProvider>
  );
}