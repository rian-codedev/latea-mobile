import {
  View,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { CheckCircle } from 'lucide-react-native';
import { formatRupiah } from '@/lib/format';
import type { Sale } from '@/lib/api-sales';

export function ReceiptModal({
  sale,
  visible,
  onClose,
}: {
  sale: Sale | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!sale) return null;

  const dateLabel = new Date(sale.sale_date).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center">
        {/* ══ BLUR BACKDROP ══ */}
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

        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* ══ CARD ══ */}
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
          {/* Success header */}
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

          {/* Struk */}
          <ScrollView
            showsVerticalScrollIndicator={false}
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

            <View className="gap-1 py-2">
              <Row label="Tanggal" value={dateLabel} />
              <Row label="Kasir" value={sale.cashier_name} />
            </View>

            <DashedLine />

            <View className="gap-2.5 py-3">
              {sale.items.map((item, i) => (
                <View key={i} className="gap-0.5">
                  <Text className="font-dm-semibold text-[12px] text-foreground dark:text-stone-50">
                    {item.product_name}
                  </Text>
                  <View className="flex-row justify-between">
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
              <Row label="Subtotal" value={formatRupiah(sale.subtotal)} />
              {sale.discount_amount > 0 ? (
                <Row
                  label="Diskon"
                  value={`-${formatRupiah(sale.discount_amount)}`}
                  destructive
                />
              ) : null}
              <View className="my-1 h-px bg-border/60 dark:bg-stone-700/60" />
              <Row
                label="TOTAL"
                value={formatRupiah(sale.total)}
                bold
                primary
              />
              <Row label="Tunai" value={formatRupiah(sale.payment_amount)} />
              <Row
                label="Kembali"
                value={formatRupiah(sale.change_amount)}
                primary
              />
            </View>
          </ScrollView>

          <View className="border-t border-border/40 p-4 dark:border-stone-800/60">
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
      </View>
    </Modal>
  );
}

/* ── Row Helper ── */
function Row({
  label,
  value,
  bold,
  primary,
  destructive,
}: {
  label: string;
  value: string;
  bold?: boolean;
  primary?: boolean;
  destructive?: boolean;
}) {
  return (
    <View className="flex-row justify-between">
      <Text className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
        {label}
      </Text>
      <Text
        className={`${bold ? 'font-dm-extrabold text-base' : 'font-dm-semibold text-[11px]'} ${
          primary
            ? 'text-primary dark:text-sage-400'
            : destructive
              ? 'text-destructive dark:text-red-400'
              : 'text-foreground dark:text-stone-50'
        }`}
      >
        {value}
      </Text>
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