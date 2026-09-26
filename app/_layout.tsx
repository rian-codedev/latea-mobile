import '@/global.css';

import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NAV_THEME } from '@/lib/theme';
import { SessionProvider, useSession } from '@/lib/session';
import { ThemeProvider } from 'expo-router/react-navigation';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
  DMSans_800ExtraBold,
} from '@expo-google-fonts/dm-sans';
import { useFirstLaunch } from '@/lib/use-first-launch';
import { LoadingSplash } from '@/lib/loading-splash';

// ⭐ Prevent native splash from auto-hiding
SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function RootNavigator() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMSans_800ExtraBold,
  });

  const { isFirstLaunch } = useFirstLaunch();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded && isFirstLaunch !== null) {
      SplashScreen.hideAsync();
      setTimeout(() => setAppReady(true), 300);
    }
  }, [fontsLoaded, isFirstLaunch]);

  useEffect(() => {
    if (appReady && isFirstLaunch === true) {
      router.replace('/(onboarding)' as any);
    }
  }, [appReady, isFirstLaunch]);

  if (!fontsLoaded || isFirstLaunch === null) {
    return <LoadingSplash />;
  }

  return (
    <>
      {/* ⭐ StatusBar DI LUAR ThemeProvider & Stack */}
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <ThemeProvider value={isDark ? NAV_THEME.dark : NAV_THEME.light}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* ❌ HAPUS StatusBar di sini — biar tidak konflik */}
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </QueryClientProvider>
  );
}