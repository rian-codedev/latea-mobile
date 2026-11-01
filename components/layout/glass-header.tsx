import { View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';
import { type ReactNode } from 'react';

export function GlassHeader({ children }: { children: ReactNode }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      intensity={70}
      tint={isDark ? 'dark' : 'light'}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: insets.top }}
      className="overflow-hidden"
    >
      <View className="absolute bottom-0 left-0 right-0 h-px bg-border/40 dark:bg-stone-800/60" />
      <View style={{ height: HEADER_HEIGHT }} className="flex-row items-center gap-3 px-3">
        {children}
      </View>
    </BlurView>
  );
}