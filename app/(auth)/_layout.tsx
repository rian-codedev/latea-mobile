import { Redirect, Stack } from 'expo-router';
import { LoadingScreen } from '@/components/feedback/loading-screen';
import { useSession } from '@/lib/stores/session';
import { useFirstLaunch } from '@/lib/hooks/use-first-launch';
import { ROUTES } from '@/lib/constants/app';

export default function AuthLayout() {
  const { user, isLoading } = useSession();
  const { isFirstLaunch } = useFirstLaunch();

  if (isLoading) return <LoadingScreen />;

  // ⭐ Cek first launch DULU
  if (isFirstLaunch === true) {
    return <Redirect href="/(onboarding)" />;
  }

  if (user) return <Redirect href={ROUTES.home as any} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}