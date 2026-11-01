import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center gap-3 bg-white p-6 dark:bg-stone-950">
        <Text className="text-4xl">🤔</Text>
        <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
          Halaman tidak ditemukan
        </Text>
        <Link href="/">
          <Text className="font-dm-semibold text-sm text-primary dark:text-sage-400">
            Kembali ke beranda
          </Text>
        </Link>
      </View>
    </>
  );
}