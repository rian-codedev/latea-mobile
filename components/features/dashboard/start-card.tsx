import { View, Pressable } from 'react-native';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ShoppingCart, Package, Tag } from 'lucide-react-native';
import { GradientBackdrop } from '@/components/layout/gradient-backdrop';
import { welcomeGradients } from '@/lib/theme/gradients';
import { Pill } from '@/components/common/pill';

export function StartCard({
  onPress,
  storeName,
  activeProducts,
  promoProducts,
  large,
}: {
  onPress: () => void;
  storeName: string;
  activeProducts: number;
  promoProducts: number;
  large?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const g = welcomeGradients(isDark);

  return (
    <View
      className={`overflow-hidden rounded-3xl border border-border/40 dark:border-stone-800/60 ${
        large ? 'p-8' : 'p-6'
      }`}
    >
      <GradientBackdrop colors={g.a} overlayColors={g.b} />

      <View
        className="absolute -right-20 -top-20 size-64 rounded-full"
        style={{ backgroundColor: isDark ? 'rgba(132,169,140,0.06)' : 'rgba(255,255,255,0.4)' }}
      />
      <View
        className="absolute -bottom-24 right-16 size-48 rounded-full"
        style={{ backgroundColor: isDark ? 'rgba(132,169,140,0.04)' : 'rgba(255,255,255,0.2)' }}
      />

      <View className="relative">
        <Text className="font-dm-medium text-xs text-muted-foreground dark:text-stone-400">
          {storeName}
        </Text>
        <Text
          className={`mt-1 font-dm-extrabold tracking-tight text-foreground dark:text-stone-50 ${
            large ? 'text-4xl' : 'text-3xl'
          }`}
        >
          Mulai transaksi
        </Text>
        <Text className="mt-1.5 max-w-[360px] font-dm-regular text-sm leading-5 text-muted-foreground dark:text-stone-400">
          Pilih produk, hitung total, lalu terima pembayaran.
        </Text>

        <View className="mt-6 flex-row flex-wrap items-center gap-3">
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="Mulai transaksi"
            className="h-12 flex-row items-center gap-2 rounded-full bg-primary px-5 active:opacity-90 dark:bg-sage-500"
          >
            <Icon as={ShoppingCart} size={17} className="text-primary-foreground" />
            <Text className="font-dm-bold text-sm text-primary-foreground">
              Buka kasir
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Pill icon={Package} text={`${activeProducts} produk`} />
            {promoProducts > 0 ? <Pill icon={Tag} text={`${promoProducts} promo`} /> : null}
          </View>
        </View>
      </View>
    </View>
  );
}