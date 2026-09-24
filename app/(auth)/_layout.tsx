import { Redirect, Stack } from 'expo-router';
import { useSession } from '@/lib/session';

export default function AuthLayout() {
  const { user, isLoading } = useSession();

  // Sudah login → redirect ke halaman utama
  if (isLoading && user) {
    return <Redirect href="/(app)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}