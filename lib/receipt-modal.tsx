import {
  View,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CheckCircle, Pencil, Trash2 } from 'lucide-react-native';
import { formatRupiah } from '@/lib/format';
import type { Sale } from '@/lib/api-sales';

/* ══════════════════════════════════════════════════════
   Receipt Modal — wrapper
   ══════════════════════════════════════════════════════ */
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
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center">
        <BlurView
          intensity={30}
          tint="dark"
          style={StyleSheet.absoluteFill}
        />

        <View
          style={StyleSheet.absoluteFill}
          className="bg-black/20 dark:bg-black/40"
          pointerEvents="none"
        />

        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

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

/* ══════════════════════════════════════════════════════
   Receipt Content
   ══════════════════════════════════════════════════════ */
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
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 24 },
        shadowOpacity: 0.35,
        shadowRadius: 40,
        elevation: 24,
      }}
      className="overflow-hidden rounded-3xl bg-white dark:bg-stone-900"
    >
      {/* Header */}
      <View className="items-center gap-1.5 border-b border-border/40 px-5 py-5 dark:border-stone-800/60">
        <View className="size-12 items-center justify-center rounded-full bg-primary/10 dark:bg-sage-500/15">
          <Icon
            as={CheckCircle}
            size={24}
            className="text-primary dark:text-sage-400"
          />
        </View>

        <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
          Detail Transaksi
        </Text>

        <Text className="font-mono text-[10px] text-muted-foreground dark:text-stone-400">
          {sale.invoice_number}
        </Text>
      </View>

      {/* Isi struk */}
      <ScrollView
        showsVerticalScrollIndicator
        contentContainerStyle={{ padding: 20 }}
      >
        {/* Store */}
        <View className="items-center gap-0.5">
          <Text className="font-dm-extrabold text-base text-foreground dark:text-stone-50">
            {sale.store?.name ?? 'Toko'}
          </Text>

          <Text className="font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
            {sale.store?.location}
          </Text>
        </View>

        <DashedLine />

        {/* ── Info transaksi ── */}
        <View className="gap-1.5 py-3">
          <Row
            label="Tanggal"
            value={dateLabel}
            valueAlign="right"
          />

          <Row
            label="Kasir"
            value={sale.cashier_name}
            valueAlign="right"
          />
        </View>

        <DashedLine />

        {/* ── Daftar item ── */}
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

        {/* ── Subtotal, Diskon, Total ── */}
        <View className="gap-1.5 py-3">
          <Row
            label="Subtotal"
            value={formatRupiah(sale.subtotal)}
            valueAlign="right"
          />

          {hasDiscount ? (
            <Row
              label="Diskon"
              value={`-${formatRupiah(sale.discount_amount)}`}
              destructive
              valueAlign="right"
            />
          ) : null}

          <View className="my-1.5 h-px bg-border/60 dark:bg-stone-700/60" />

          <Row
            label="TOTAL"
            value={formatRupiah(sale.total)}
            bold
            primary
            valueAlign="right"
          />
        </View>

        {/* ── Tunai & Kembali ── */}
        <View className="gap-1.5 rounded-2xl bg-muted/40 px-3 py-2.5 dark:bg-stone-800/40">
          <Row
            label="Tunai"
            value={formatRupiah(sale.payment_amount)}
            valueAlign="right"
          />

          <Row
            label="Kembali"
            value={formatRupiah(sale.change_amount)}
            primary
            valueAlign="right"
          />
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="border-t border-border/40 p-4 dark:border-stone-800/60">
        {canModify ? (
          <View className="mb-3 flex-row gap-2">
            {/* Edit */}
            <Pressable
              onPress={onEdit}
              className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-border/60 bg-white active:opacity-70 dark:border-stone-700/60 dark:bg-stone-900"
            >
              <Icon
                as={Pencil}
                size={14}
                className="text-foreground dark:text-stone-50"
              />

              <Text className="font-dm-bold text-xs text-foreground dark:text-stone-50">
                Edit
              </Text>
            </Pressable>

            {/* Delete */}
            <Pressable
              onPress={onDelete}
              className="h-10 flex-1 flex-row items-center justify-center gap-1.5 rounded-full border border-red-500/40 bg-red-50 active:opacity-70 dark:border-red-500/40 dark:bg-red-950/30"
              android_ripple={{
                color: 'rgba(239, 68, 68, 0.12)',
                borderless: false,
              }}
            >
              <Icon
                as={Trash2}
                size={14}
                className="text-red-600 dark:text-red-400"
              />

              <Text className="font-dm-bold text-xs text-red-600 dark:text-red-400">
                Hapus
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Close */}
        <Pressable
          onPress={onClose}
          className="h-11 items-center justify-center rounded-full bg-primary active:opacity-90 dark:bg-sage-500"
        >
          <Text className="font-dm-bold text-sm text-primary-foreground">
            Tutup
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Helpers
   ══════════════════════════════════════════════════════ */

function Row({
  label,
  value,
  bold,
  primary,
  destructive,
  valueAlign = 'right',
}: {
  label: string;
  value: string;
  bold?: boolean;
  primary?: boolean;
  destructive?: boolean;
  valueAlign?: 'left' | 'right';
}) {
  return (
    <View className="w-full flex-row items-center justify-between gap-3">
      {/* Label selalu di kiri */}
      <Text
        className={`shrink-0 font-dm-regular text-muted-foreground dark:text-stone-400 ${
          bold ? 'text-sm' : 'text-[11px]'
        }`}
      >
        {label}
      </Text>

      {/* Value selalu mengambil sisa ruang + rata kanan */}
      <View className="min-w-0 flex-1 items-end">
        <Text
          className={`${
            bold
              ? 'font-dm-extrabold text-lg'
              : 'font-dm-semibold text-[12px]'
          } ${
            primary
              ? 'text-primary dark:text-sage-400'
              : destructive
                ? 'text-destructive dark:text-red-400'
                : 'text-foreground dark:text-stone-50'
          }`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function DashedLine() {
  return (
    <View className="flex-row justify-between">
      {Array.from({ length: 40 }).map((_, i) => (
        <View
          key={i}
          className="h-px w-[4px] bg-border dark:bg-stone-700"
        />
      ))}
    </View>
  );
}