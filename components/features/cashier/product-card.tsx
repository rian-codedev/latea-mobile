import { Pressable, View, Text as RNText, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/lib/utils/format';
import type { ApiProduct } from '@/lib/api/product';
import { PRODUCT_CARD_HEIGHT, PRODUCT_IMAGE_HEIGHT } from '@/lib/theme/sizing';

export function ProductCard({
  product,
  qty,
  onPress,
}: {
  product: ApiProduct;
  qty: number;
  onPress: () => void;
}) {
  const hasPromo =
    product.discount_price != null && product.minimal_discount != null;
  const inCart = qty > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        height: PRODUCT_CARD_HEIGHT,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
      className={`flex-1 overflow-hidden rounded-2xl border-[1.5px] bg-white dark:bg-stone-900 ${
        inCart
          ? 'border-primary dark:border-sage-500'
          : 'border-border/40 dark:border-stone-800/60'
      }`}
    >
      <View
        style={{ height: PRODUCT_IMAGE_HEIGHT }}
        className="items-center justify-center overflow-hidden"
      >
        <View className="absolute inset-0 bg-accent/60 dark:bg-stone-800" />
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <RNText className="text-[46px] leading-none">
            {product.emoji ?? '📦'}
          </RNText>
        )}

        <View className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 dark:bg-stone-900/95">
          <Text className="font-dm-bold text-[10px] tracking-wide text-foreground dark:text-stone-50">
            {product.code}
          </Text>
        </View>

        {inCart ? (
          <View className="absolute right-2 top-2 h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1.5 dark:bg-sage-500">
            <Text className="font-dm-bold text-[11px] text-primary-foreground">
              {qty}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-1 justify-between p-2.5">
        <Text
          className="font-dm-bold text-[13px] leading-tight text-foreground dark:text-stone-50"
          numberOfLines={1}
        >
          {product.name}
        </Text>

        <View className="gap-1">
          <View className="flex-row items-baseline">
            <Text className="mr-0.5 font-dm-medium text-[10px] text-muted-foreground dark:text-stone-400">
              Rp
            </Text>
            <Text className="font-dm-extrabold text-base leading-none tracking-tight text-foreground dark:text-stone-50">
              {Number(product.price).toLocaleString('id-ID')}
            </Text>
          </View>
          {hasPromo ? (
            <Badge
              tone="danger"
              text={`≥${product.minimal_discount} pcs: ${formatRupiah(product.discount_price!)}`}
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}