import { Redirect, Stack } from 'expo-router';
import { LoadingScreen } from '@/components/feedback/loading-screen';
import { useSession } from '@/lib/stores/session';
import { ROUTES } from '@/lib/constants/app';

export default function AuthLayout() {
  const { user, isLoading } = useSession();

  if (isLoading) return <LoadingScreen />;
  if (user) return <Redirect href={ROUTES.home as any} />;

  return <Stack screenOptions={{ headerShown: false }} />;
}