import { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { CountBadge } from '@/components/ui/badge';
import { Store as StoreIcon, ChevronDown, ChevronUp } from 'lucide-react-native';
import { ProductImage } from '@/components/common/product-image';
import { formatRupiah } from '@/lib/utils/format';
import type { ApiProduct } from '@/lib/api/product';

const INITIAL_COUNT = 5;

export function ProductListCard({ products }: { products: ApiProduct[] }) {
  const isEmpty = products.length === 0;
  const [isExpanded, setIsExpanded] = useState(false);

  const toggle = useCallback(() => setIsExpanded((p) => !p), []);

  const displayed = isExpanded ? products : products.slice(0, INITIAL_COUNT);
  const hasMore = products.length > INITIAL_COUNT;

  return (
    <View className="overflow-hidden rounded-2xl border border-border/40 bg-white dark:border-stone-800/60 dark:bg-stone-900">
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={isExpanded ? 'Tutup daftar produk' : 'Buka daftar produk'}
        className="flex-row items-center justify-between px-4 py-3 active:bg-muted/40 dark:active:bg-stone-800/40"
      >
        <View className="flex-row items-center gap-2">
          <Icon as={StoreIcon} size={15} className="text-primary dark:text-sage-400" />
          <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
            Produk di toko Anda
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {!isEmpty ? <CountBadge count={products.length} /> : null}
          <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
            <Icon as={ChevronDown} size={16} className="text-muted-foreground dark:text-stone-400" />
          </View>
        </View>
      </Pressable>

      {isEmpty ? (
        <View className="items-center gap-1 border-t border-border/40 px-4 py-10 dark:border-stone-800/60">
          <Text className="text-3xl">📦</Text>
          <Text className="font-dm-semibold text-sm text-foreground dark:text-stone-50">
            Belum ada produk
          </Text>
          <Text className="text-center font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            Admin belum meng-assign produk ke toko Anda
          </Text>
        </View>
      ) : (
        <View className="border-t border-border/40 dark:border-stone-800/60">
          {displayed.map((p, i) => {
            const hasPromo = p.discount_price != null && p.minimal_discount != null;
            const displayPrice = hasPromo ? p.discount_price! : p.price;

            return (
              <View
                key={p.id}
                className={`flex-row items-center gap-3 px-4 py-2.5 ${
                  i < displayed.length - 1 ? 'border-b border-border/30 dark:border-stone-800/40' : ''
                }`}
              >
                <ProductImage uri={p.image_url} emoji={p.emoji} size={48} />
                <View className="flex-1">
                  <Text
                    className="font-dm-semibold text-[12px] leading-tight text-foreground dark:text-stone-50"
                    numberOfLines={1}
                  >
                    {p.name}
                  </Text>
                  <View className="mt-0.5 flex-row items-center gap-1.5">
                    <Text className="font-mono text-[10px] text-muted-foreground dark:text-stone-400">
                      {p.code}
                    </Text>
                    {hasPromo ? (
                      <View className="rounded bg-destructive/10 px-1 py-px dark:bg-red-500/15">
                        <Text className="font-dm-bold text-[8px] text-destructive dark:text-red-400">
                          PROMO
                        </Text>
                      </View>
                    ) : null}
                    {!p.is_available && (
                      <View className="rounded bg-amber-100 px-1 py-px dark:bg-amber-950/60">
                        <Text className="font-dm-bold text-[8px] text-amber-700 dark:text-amber-400">
                          HABIS
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View className="items-end">
                  {hasPromo ? (
                    <Text className="font-dm-regular text-[9px] text-muted-foreground line-through dark:text-stone-400">
                      {formatRupiah(p.price, false)}
                    </Text>
                  ) : null}
                  <Text className="font-dm-bold text-[12px] text-foreground dark:text-stone-50">
                    {formatRupiah(displayPrice, false)}
                  </Text>
                </View>
              </View>
            );
          })}

          {hasMore && (
            <Pressable
              onPress={toggle}
              className="flex-row items-center justify-center gap-1 border-t border-border/40 bg-muted/20 py-2.5 active:bg-muted/50 dark:border-stone-800/60 dark:bg-stone-800/20 dark:active:bg-stone-800/40"
            >
              <Text className="font-dm-semibold text-[11px] text-primary dark:text-sage-400">
                {isExpanded ? 'Sembunyikan' : `Lihat ${products.length - INITIAL_COUNT} produk lainnya`}
              </Text>
              <Icon
                as={isExpanded ? ChevronUp : ChevronDown}
                size={14}
                className="text-primary dark:text-sage-400"
              />
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}