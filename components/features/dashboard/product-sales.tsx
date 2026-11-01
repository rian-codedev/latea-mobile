import { useMemo, useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Package, ChevronDown, ChevronUp } from 'lucide-react-native';
import type { ProductSummaryItem } from '@/lib/api/sales';
import { EmptyState } from '@/components/feedback/empty-state';

export function ProductSalesCard({ products }: { products: ProductSummaryItem[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_COUNT = 4;
  const isEmpty = products.length === 0;

  const toggle = useCallback(() => setIsExpanded((p) => !p), []);

  const maxQty = useMemo(
    () => Math.max(...products.map((p) => Number(p.total_qty)), 1),
    [products],
  );

  const displayed = isExpanded ? products : products.slice(0, INITIAL_COUNT);
  const hasMore = products.length > INITIAL_COUNT;

  return (
    <View className="overflow-hidden rounded-xl border border-border/40 bg-white dark:border-stone-800/60 dark:bg-stone-900">
      <Pressable
        onPress={toggle}
        className="flex-row items-center justify-between border-b border-border/40 px-4 py-3 active:bg-muted/40 dark:border-stone-800/60 dark:active:bg-stone-800/40"
      >
        <View className="flex-row items-center gap-2.5">
          <View className="size-7 items-center justify-center rounded-lg bg-primary/10 dark:bg-sage-500/15">
            <Icon as={Package} size={14} className="text-primary dark:text-sage-400" />
          </View>
          <View>
            <Text className="font-dm-bold text-xs text-foreground dark:text-stone-50">
              Produk Terjual
            </Text>
            <Text className="font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
              Terurut dari yang paling banyak
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          <View className="rounded-full bg-muted px-2 py-0.5 dark:bg-stone-800">
            <Text className="font-mono text-[10px] font-bold text-muted-foreground dark:text-stone-400">
              {products.length}
            </Text>
          </View>
          <View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
            <Icon
              as={ChevronDown}
              size={16}
              className="text-muted-foreground dark:text-stone-400"
            />
          </View>
        </View>
      </Pressable>

      {isEmpty ? (
        <EmptyState emoji="📊" title="Belum ada produk terjual hari ini" />
      ) : (
        <View>
          {displayed.map((product, index) => {
            const qty = Number(product.total_qty);
            const percentage = (qty / maxQty) * 100;
            return (
              <View
                key={product.product_id}
                className={`flex-row items-center gap-3 px-4 py-2.5 ${
                  index < displayed.length - 1
                    ? 'border-b border-border/30 dark:border-stone-800/40'
                    : ''
                }`}
              >
                <View
                  className={`size-6 shrink-0 items-center justify-center rounded-full ${
                    index === 0
                      ? 'bg-amber-100 dark:bg-amber-950/60'
                      : index === 1
                      ? 'bg-stone-200 dark:bg-stone-700'
                      : index === 2
                      ? 'bg-orange-100 dark:bg-orange-950/60'
                      : 'bg-stone-100 dark:bg-stone-800'
                  }`}
                >
                  <Text
                    className={`font-dm-extrabold text-[10px] ${
                      index === 0
                        ? 'text-amber-700 dark:text-amber-400'
                        : index === 1
                        ? 'text-stone-700 dark:text-stone-300'
                        : index === 2
                        ? 'text-orange-700 dark:text-orange-400'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {index + 1}
                  </Text>
                </View>

                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text
                      className="flex-1 truncate font-dm-medium text-[11px] text-foreground dark:text-stone-50"
                      numberOfLines={1}
                    >
                      {product.product_name}
                    </Text>
                    <Text className="shrink-0 font-mono text-[11px] font-bold text-foreground dark:text-stone-50">
                      {qty} pcs
                    </Text>
                  </View>
                  <View className="mt-1 flex-row items-center gap-2">
                    <View className="h-1 flex-1 overflow-hidden rounded-full bg-muted dark:bg-stone-800">
                      <View
                        style={{ width: `${percentage}%` }}
                        className="h-full rounded-full bg-primary dark:bg-sage-400"
                      />
                    </View>
                    <Text className="shrink-0 font-mono text-[10px] text-muted-foreground dark:text-stone-400">
                      Rp {Number(product.total_revenue).toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {hasMore && (
            <Pressable
              onPress={toggle}
              className="flex-row items-center justify-center gap-1 border-t border-border/40 bg-muted/20 py-2.5 active:bg-muted/50 dark:border-stone-800/60 dark:bg-stone-800/20"
            >
              <Text className="font-dm-semibold text-[11px] text-primary dark:text-sage-400">
                {isExpanded
                  ? 'Sembunyikan'
                  : `Lihat ${products.length - INITIAL_COUNT} produk lainnya`}
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