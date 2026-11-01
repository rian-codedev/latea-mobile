import { View, FlatList, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { CountBadge } from '@/components/ui/badge';
import { IconButton } from '@/components/ui/icon-button';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X } from 'lucide-react-native';
import { useCart, calcTotals } from '@/lib/stores/cart';
import { formatRupiah } from '@/lib/utils/format';
import { CartRow } from './cart-row';
import { EmptyState } from '@/components/feedback/empty-state';

export function CartPanel({
  bottomInset = 0,
  onClose,
  onCheckout,
}: {
  bottomInset?: number;
  onClose?: () => void;
  onCheckout: () => void;
}) {
  const items = useCart((s) => s.items);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const removeItem = useCart((s) => s.removeItem);
  const clear = useCart((s) => s.clear);

  const { subtotal, discount, total } = calcTotals(items);
  const itemCount = items.reduce((a, i) => a + i.quantity, 0);
  const isEmpty = items.length === 0;

  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between border-b border-border/40 px-4 py-3 dark:border-stone-800/60">
        <View className="flex-row items-center gap-2">
          <Icon as={ShoppingCart} size={17} className="text-primary dark:text-sage-400" />
          <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
            Keranjang
          </Text>
          {itemCount > 0 ? <CountBadge count={itemCount} /> : null}
        </View>

        <View className="flex-row items-center gap-3">
          {!isEmpty ? (
            <Pressable onPress={clear} hitSlop={8}>
              <Text className="font-dm-semibold text-xs text-destructive dark:text-red-400">
                Kosongkan
              </Text>
            </Pressable>
          ) : null}
          {onClose ? (
            <IconButton
              icon={X}
              variant="filled"
              size="sm"
              onPress={onClose}
              accessibilityLabel="Tutup keranjang"
            />
          ) : null}
        </View>
      </View>

      <View className="flex-1">
        {isEmpty ? (
          <View className="flex-1">
            <EmptyState
              emoji="🛒"
              title="Keranjang kosong"
              description="Tap produk di katalog untuk menambahkannya"
            />
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => String(i.productId)}
            contentContainerStyle={{ paddingHorizontal: 14 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <CartRow
                item={item}
                onInc={() => increment(item.productId)}
                onDec={() => decrement(item.productId)}
                onRemove={() => removeItem(item.productId)}
              />
            )}
          />
        )}
      </View>

      <View
        className="border-t border-border/40 bg-muted/40 px-4 pt-3 dark:border-stone-800/60 dark:bg-stone-800/30"
        style={{ paddingBottom: Math.max(bottomInset, 12) }}
      >
        <View className="mb-3 gap-1.5">
          <View className="flex-row justify-between">
            <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
              Subtotal
            </Text>
            <Text className="font-dm-medium text-xs text-foreground dark:text-stone-50">
              {formatRupiah(subtotal)}
            </Text>
          </View>
          {discount > 0 ? (
            <View className="flex-row justify-between">
              <Text className="font-dm-regular text-xs text-destructive dark:text-red-400">
                Diskon
              </Text>
              <Text className="font-dm-medium text-xs text-destructive dark:text-red-400">
                -{formatRupiah(discount)}
              </Text>
            </View>
          ) : null}
          <View className="my-1 h-px bg-border/60 dark:bg-stone-700/60" />
          <View className="flex-row items-center justify-between">
            <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
              Total
            </Text>
            <Text className="font-dm-extrabold text-xl leading-none tracking-tight text-primary dark:text-sage-400">
              {formatRupiah(total)}
            </Text>
          </View>
        </View>

        <Button
          label="Bayar"
          onPress={onCheckout}
          disabled={isEmpty}
          fullWidth
        />
      </View>
    </View>
  );
}