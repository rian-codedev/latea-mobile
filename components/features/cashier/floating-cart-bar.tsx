import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ShoppingCart, ChevronUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { formatRupiah } from '@/lib/utils/format';
import { softGradients } from '@/lib/theme/gradients';
import { CART_BAR_HEIGHT } from '@/lib/theme/sizing';

export function FloatingCartBar({
  itemCount,
  total,
  onPress,
}: {
  itemCount: number;
  total: number;
  onPress: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const g = softGradients(isDark);

  if (itemCount === 0) return null;

  return (
    <View
      className="absolute bottom-0 left-0 right-0 px-3"
      style={{ paddingBottom: insets.bottom + 12 }}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        style={{ height: CART_BAR_HEIGHT }}
        className="overflow-hidden rounded-full border border-border/40 active:opacity-90 dark:border-stone-800/60"
      >
        <LinearGradient colors={[...g.a]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={[...g.b]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 0 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
        />
        <View className="h-full flex-row items-center justify-between px-2">
          <View className="flex-row items-center gap-3">
            <View className="size-10 items-center justify-center rounded-full bg-primary dark:bg-sage-500">
              <Icon as={ShoppingCart} size={18} className="text-primary-foreground" />
            </View>
            <View>
              <Text className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
                {itemCount} item
              </Text>
              <Text className="font-dm-extrabold text-base leading-tight tracking-tight text-foreground dark:text-stone-50">
                {formatRupiah(total)}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-1 pr-3">
            <Text className="font-dm-bold text-sm text-primary dark:text-sage-400">
              Lihat keranjang
            </Text>
            <Icon as={ChevronUp} size={18} className="text-primary dark:text-sage-400" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}