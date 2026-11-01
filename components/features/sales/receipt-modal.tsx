import { View, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CheckCircle, Pencil, Trash2 } from 'lucide-react-native';
import { formatRupiah } from '@/lib/utils/format';
import { DashedLine } from '@/components/common/dashed-line';
import { ReceiptRow } from '@/components/common/receipt-row';
import type { Sale } from '@/lib/api/sales';

export function ReceiptModal({
  sale,
  visible,
  onClose,
  onEdit,
  onDelete,
  canModify = false,
}: {
  sale: Sale | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canModify?: boolean;
}) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center">
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <View
          style={StyleSheet.absoluteFill}
          className="bg-black/20 dark:bg-black/40"
          pointerEvents="none"
        />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {sale ? (
          <ReceiptContent
            sale={sale}
            onClose={onClose}
            onEdit={onEdit}
            onDelete={onDelete}
            canModify={canModify}
          />
        ) : null}
      </View>
    </Modal>
  );
}

function ReceiptContent({
  sale,
  onClose,
  onEdit,
  onDelete,
  canModify,
}: {
  sale: Sale;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canModify: boolean;
}) {
  const dateLabel = new Date(sale.sale_date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const items = sale.items ?? [];
  const hasDiscount = Number(sale.discount_amount) > 0;

  return (
    <View
      style={{
        width: '90%',
        maxWidth: 400,
        maxHeight: '88%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.35,
        shadowRadius: 40,
        elevation: 24,
      }}
      className="overflow-hidden rounded-3xl bg-white dark:bg-stone-900"
    >
      <View className="items-center gap-1.5 border-b border-border/40 px-5 py-5 dark:border-stone-800/60">
        <View className="size-12 items-center justify-center rounded-full bg-primary/10 dark:bg-sage-500/15">
          <Icon as={CheckCircle} size={24} className="text-primary dark:text-sage-400" />
        </View>
        <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
          Detail Transaksi
        </Text>
        <Text className="font-mono text-[10px] text-muted-foreground dark:text-stone-400">
          {sale.invoice_number}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator
        contentContainerStyle={{ padding: 20 }}
      >
        <View className="items-center gap-0.5">
          <Text className="font-dm-extrabold text-base text-foreground dark:text-stone-50">
            {sale.store?.name ?? 'Toko'}
          </Text>
          <Text className="font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
            {sale.store?.location}
          </Text>
        </View>

        <DashedLine />

        <View className="gap-1.5 py-3">
          <ReceiptRow label="Tanggal" value={dateLabel} />
          <ReceiptRow label="Kasir" value={sale.cashier_name} />
        </View>

        <DashedLine />

        <View className="gap-2.5 py-3">
          {items.map((item, i) => (
            <View key={i} className="gap-0.5">
              <Text className="font-dm-semibold text-[12px] text-foreground dark:text-stone-50">
                {item.product_name}
              </Text>
              <View className="flex-row items-center justify-between gap-3">
                <Text className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
                  {item.quantity} × {formatRupiah(item.effective_price)}
                </Text>
                <Text className="font-dm-bold text-[12px] text-foreground dark:text-stone-50">
                  {formatRupiah(item.line_total)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <DashedLine />

        <View className="gap-1.5 py-3">
          <ReceiptRow label="Subtotal" value={formatRupiah(sale.subtotal)} />
          {hasDiscount ? (
            <ReceiptRow
              label="Diskon"
              value={`-${formatRupiah(sale.discount_amount)}`}
              destructive
            />
          ) : null}
          <View className="my-1.5 h-px bg-border/60 dark:bg-stone-700/60" />
          <ReceiptRow
            label="TOTAL"
            value={formatRupiah(sale.total)}
            bold
            primary
          />
        </View>

        <View className="gap-1.5 rounded-2xl bg-muted/40 px-3 py-2.5 dark:bg-stone-800/40">
          <ReceiptRow label="Tunai" value={formatRupiah(sale.payment_amount)} />
          <ReceiptRow
            label="Kembali"
            value={formatRupiah(sale.change_amount)}
            primary
          />
        </View>
      </ScrollView>

      <View className="border-t border-border/40 p-4 dark:border-stone-800/60">
        {canModify ? (
          <View className="mb-3 flex-row gap-2">
            <Pressable
              onPress={onEdit}
              className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-border/60 bg-white active:opacity-70 dark:border-stone-700/60 dark:bg-stone-900"
            >
              <Icon as={Pencil} size={14} className="text-foreground dark:text-stone-50" />
              <Text className="font-dm-bold text-xs text-foreground dark:text-stone-50">
                Edit
              </Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-red-500/40 bg-red-50 active:opacity-70 dark:border-red-500/40 dark:bg-red-950/30"
            >
              <Icon as={Trash2} size={14} className="text-red-600 dark:text-red-400" />
              <Text className="font-dm-bold text-xs text-red-600 dark:text-red-400">
                Hapus
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={onClose}
          className="h-11 items-center justify-center rounded-full bg-primary active:opacity-90 dark:bg-sage-500"
        >
          <Text className="font-dm-bold text-sm text-primary-foreground">Tutup</Text>
        </Pressable>
      </View>
    </View>
  );
}