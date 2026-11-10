import '@/global.css';

import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
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
import { useIdleTimeout } from '@/lib/hooks/use-idle-timeout';
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
  const {
    user,
    expiredReason,
    clearExpiredReason,
    expireIdle,
  } = useSession();

  useThemeSync();

  const sessionIdleMinutes = usePreferences((s) => s.sessionIdleMinutes);
  const { bumpActivity } = useIdleTimeout({
    enabled: !!user && sessionIdleMinutes > 0,
    timeoutMs: sessionIdleMinutes * 60 * 1000,
    onTimeout: expireIdle,
  });

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

  if (
    !fontsLoaded ||
    isFirstLaunch === null ||
    !appReady ||
    !prefsHydrated
  ) {
    return <LoadingSplash />;
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ThemeProvider value={isDark ? NAV_THEME.dark : NAV_THEME.light}>
        {/*
         * ⭐ Wrapper untuk deteksi interaksi user (bumpActivity).
         * onStartShouldSetResponderCapture fires untuk SEMUA touch
         * sebelum child menangkapnya. Return false = jangan ambil alih.
         *
         * Catatan: touch di dalam Modal TIDAK sampai ke wrapper ini
         * (Modal di-render di root terpisah). Untuk MVP acceptable
         * karena modal biasanya interaksi singkat.
         */}
        <View
          style={{ flex: 1 }}
          onStartShouldSetResponderCapture={() => {
            bumpActivity();
            return false;
          }}
        >
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </View>
        <PortalHost />
      </ThemeProvider>

      <AuthExpiredToast
        reason={expiredReason}
        onHide={clearExpiredReason}
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