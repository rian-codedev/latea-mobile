import { View, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';

export function LoadingScreen({ message }: { message?: string }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-stone-950">
      <ActivityIndicator size="large" color={isDark ? '#A3C9A8' : '#84A98C'} />
      {message ? (
        <Text className="mt-4 font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
          {message}
        </Text>
      ) : null}
    </View>
  );
}