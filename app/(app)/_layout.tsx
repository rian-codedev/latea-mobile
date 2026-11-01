import { Redirect, Stack } from 'expo-router';
import { LoadingScreen } from '@/components/feedback/loading-screen';
import { useSession } from '@/lib/stores/session';

export default function AppLayout() {
  const { user, isLoading } = useSession();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cashier" />
    </Stack>
  );
}