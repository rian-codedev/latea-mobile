import { Redirect, Stack } from 'expo-router';
import { LoadingScreen } from '@/components/feedback/loading-screen';
import { useSession } from '@/lib/stores/session';
import { useFirstLaunch } from '@/lib/hooks/use-first-launch';

export default function AppLayout() {
  const { user, isLoading } = useSession();
  const { isFirstLaunch } = useFirstLaunch();

  if (isLoading) return <LoadingScreen />;

  // ⭐ Cek first launch DULU — sebelum redirect login
  if (isFirstLaunch === true) {
    return <Redirect href="/(onboarding)" />;
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cashier" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}