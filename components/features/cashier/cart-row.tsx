import { View, Pressable, Image, Text as RNText } from 'react-native';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { formatRupiah } from '@/lib/utils/format';
import { effectivePrice, type CartItem } from '@/lib/stores/cart';

export function CartRow({
  item,
  onInc,
  onDec,
  onRemove,
}: {
  item: CartItem;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  const ep = effectivePrice(item);
  const lineTotal = ep * item.quantity;
  const promoActive =
    item.discountPrice != null &&
    item.minimalDiscount != null &&
    item.quantity >= item.minimalDiscount;

  return (
    <View className="flex-row gap-2.5 border-b border-border/30 py-3 dark:border-stone-800/40">
      <View className="size-11 items-center justify-center overflow-hidden rounded-xl bg-accent/60 dark:bg-stone-800">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <RNText className="text-xl">{item.emoji}</RNText>
        )}
      </View>

      <View className="flex-1 gap-2">
        <View>
          <Text
            className="font-dm-semibold text-[13px] leading-tight text-foreground dark:text-stone-50"
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
              {formatRupiah(ep)}
            </Text>
            {promoActive ? <Badge tone="danger" text="PROMO" /> : null}
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          <IconButton icon={Minus} size="sm" variant="outline" onPress={onDec} accessibilityLabel="Kurangi jumlah" />
          <Text className="min-w-[28px] text-center font-dm-bold text-sm text-foreground dark:text-stone-50">
            {item.quantity}
          </Text>
          <IconButton icon={Plus} size="sm" variant="outline" onPress={onInc} accessibilityLabel="Tambah jumlah" />
        </View>
      </View>

      <View className="items-end justify-between">
        <Pressable onPress={onRemove} hitSlop={8} accessibilityLabel="Hapus dari keranjang" className="p-0.5">
          <Icon as={Trash2} size={15} className="text-destructive/70 dark:text-red-400/70" />
        </Pressable>
        <Text className="font-dm-bold text-[13px] text-foreground dark:text-stone-50">
          {formatRupiah(lineTotal)}
        </Text>
      </View>
    </View>
  );
}