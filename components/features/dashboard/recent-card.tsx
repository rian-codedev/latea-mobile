import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { CountBadge } from '@/components/ui/badge';
import { Clock, ChevronRight, Receipt } from 'lucide-react-native';
import { EmptyState } from '@/components/feedback/empty-state';
import { formatRupiah } from '@/lib/utils/format';
import {
  RECENT_MAX_HEIGHT,
  RECENT_VISIBLE_ITEMS,
} from '@/lib/theme/sizing';
import type { SaleListItem } from '@/lib/api/sales';

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function RecentCard({
  sales,
  onSalePress,
}: {
  sales: SaleListItem[];
  onSalePress: (saleId: number) => void;
}) {
  const isEmpty = sales.length === 0;
  const hasMore = sales.length > RECENT_VISIBLE_ITEMS;

  return (
    <View className="overflow-hidden rounded-2xl border border-border/40 bg-white dark:border-stone-800/60 dark:bg-stone-900">
      <View className="flex-row items-center gap-2.5 border-b border-border/40 px-4 py-3 dark:border-stone-800/60">
        <View className="size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/60">
          <Icon
            as={Clock}
            size={15}
            className="text-amber-700 dark:text-amber-400"
          />
        </View>
        <Text className="flex-1 font-dm-bold text-sm text-foreground dark:text-stone-50">
          Transaksi Hari Ini
        </Text>
        {!isEmpty ? (
          <CountBadge count={sales.length} />
        ) : (
          <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            —
          </Text>
        )}
      </View>

      {isEmpty ? (
        <EmptyState
          icon={Receipt}
          title="Belum ada transaksi"
          description="Transaksi hari ini akan muncul di sini"
        />
      ) : (
        <ScrollView
          style={{ maxHeight: RECENT_MAX_HEIGHT }}
          showsVerticalScrollIndicator={hasMore}
          nestedScrollEnabled
          bounces={false}
        >
          {sales.map((t, i) => {
            const shortId =
              t.invoice_number.split('-').pop() ?? t.invoice_number;
            return (
              <Pressable
                key={t.id}
                onPress={() => onSalePress(t.id)}
                accessibilityRole="button"
                accessibilityLabel={`Lihat detail transaksi ${t.invoice_number}`}
                className={`flex-row items-center gap-3 px-4 py-3 active:bg-muted/40 dark:active:bg-stone-800/40 ${
                  i < sales.length - 1
                    ? 'border-b border-border/30 dark:border-stone-800/40'
                    : ''
                }`}
              >
                <View className="size-10 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40">
                  <Text className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400">
                    {formatTime(t.sale_date)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="font-dm-semibold text-[13px] text-foreground dark:text-stone-50">
                    #{shortId}
                  </Text>
                  <Text className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
                    {t.items_count} item
                  </Text>
                </View>
                <Text className="font-dm-bold text-[13px] text-foreground dark:text-stone-50">
                  {formatRupiah(t.total)}
                </Text>
                <Icon
                  as={ChevronRight}
                  size={15}
                  className="text-muted-foreground/60 dark:text-stone-500/60"
                />
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {hasMore ? (
        <View className="border-t border-border/40 bg-muted/30 px-4 py-2 dark:border-stone-800/60 dark:bg-stone-800/30">
          <Text className="text-center font-dm-regular text-[10.5px] text-muted-foreground dark:text-stone-400">
            Scroll untuk melihat{' '}
            {sales.length - RECENT_VISIBLE_ITEMS} lainnya
          </Text>
        </View>
      ) : null}
    </View>
  );
}