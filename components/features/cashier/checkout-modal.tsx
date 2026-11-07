import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Text as RNText,
} from 'react-native';
import * as Crypto from 'expo-crypto';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Banknote, X, Check } from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useCart, effectivePrice, calcTotals } from '@/lib/stores/cart';
import { formatRupiah } from '@/lib/utils/format';
import { getErrorMessage } from '@/lib/api/client';
import { createSale, updateSale, type Sale } from '@/lib/api/sales';
import { enqueueSale } from '@/lib/sales-queue';
import { useThrottledCallback } from '@/lib/utils/throttle';

const CASH_DENOMS = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
const FALLBACK_MULTS = [5000, 10000, 50000, 100000, 500000];

function quickAmounts(total: number): number[] {
  const result: number[] = [total];
  for (const denom of CASH_DENOMS) {
    if (denom > total && !result.includes(denom)) {
      result.push(denom);
      if (result.length >= 5) break;
    }
  }
  if (result.length < 5) {
    for (const m of FALLBACK_MULTS) {
      const rounded = Math.ceil(total / m) * m;
      if (rounded > total && !result.includes(rounded)) {
        result.push(rounded);
        if (result.length >= 5) break;
      }
    }
  }
  return result.sort((a, b) => a - b).slice(0, 5);
}

type CartItem = ReturnType<typeof useCart.getState>['items'][number];

/* ── Baris item: memo agar tidak render ulang saat mengetik nominal ── */
const ItemRow = memo(function ItemRow({ item }: { item: CartItem }) {
  const ep = effectivePrice(item);
  return (
    <View className="flex-row items-center gap-3 border-b border-border/30 py-2.5 dark:border-stone-800/40">
      <View className="size-8 items-center justify-center overflow-hidden rounded-lg bg-accent/60 dark:bg-stone-800">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <RNText className="text-sm">{item.emoji}</RNText>
        )}
      </View>
      <View className="flex-1">
        <Text
          className="font-dm-semibold text-[12px] text-foreground dark:text-stone-50"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text className="font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
          {item.quantity} × {formatRupiah(ep)}
        </Text>
      </View>
      <Text className="font-dm-bold text-[12px] text-foreground dark:text-stone-50">
        {formatRupiah(ep * item.quantity)}
      </Text>
    </View>
  );
});

/* ── Ringkasan: hanya render ulang jika item/total berubah ── */
const SummaryCard = memo(function SummaryCard({
  items,
  subtotal,
  discount,
  total,
}: {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
}) {
  const totalQty = useMemo(() => items.reduce((a, i) => a + i.quantity, 0), [items]);

  return (
    <View className="overflow-hidden rounded-2xl border border-border/40 bg-white dark:border-stone-800/60 dark:bg-stone-900">
      <View className="border-b border-border/40 px-4 py-2.5 dark:border-stone-800/60">
        <Text className="font-dm-bold text-xs text-foreground dark:text-stone-50">
          Ringkasan · {totalQty} item
        </Text>
      </View>
      <View className="px-4">
        {items.map((item) => (
          <ItemRow key={item.productId} item={item} />
        ))}
      </View>

      <View className="gap-1.5 border-t border-border/40 bg-muted/30 px-4 py-3 dark:border-stone-800/60 dark:bg-stone-800/20">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            Subtotal
          </Text>
          <Text className="shrink-0 font-dm-medium text-xs text-foreground dark:text-stone-50" numberOfLines={1}>
            {formatRupiah(subtotal)}
          </Text>
        </View>

        {discount > 0 ? (
          <View className="flex-row items-center justify-between gap-3">
            <Text className="font-dm-regular text-xs text-destructive dark:text-red-400">Diskon</Text>
            <Text className="shrink-0 font-dm-medium text-xs text-destructive dark:text-red-400" numberOfLines={1}>
              -{formatRupiah(discount)}
            </Text>
          </View>
        ) : null}

        <View className="my-1 h-px bg-border/60 dark:bg-stone-700/60" />

        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">Total</Text>
          <Text
            className="shrink-0 font-dm-extrabold text-2xl leading-none tracking-tight text-primary dark:text-sage-400"
            numberOfLines={1}
          >
            {formatRupiah(total)}
          </Text>
        </View>
      </View>
    </View>
  );
});

/* ── Tombol nominal cepat: memo ── */
const QuickAmount = memo(function QuickAmount({
  amount,
  isExact,
  active,
  onPick,
}: {
  amount: number;
  isExact: boolean;
  active: boolean;
  onPick: (amount: number) => void;
}) {
  return (
    <Pressable
      onPress={() => onPick(amount)}
      className={`h-9 min-w-[80px] items-center justify-center rounded-full border active:opacity-80 ${
        active
          ? 'border-primary bg-primary dark:border-sage-500 dark:bg-sage-500'
          : 'border-border/60 bg-white dark:border-stone-700/60 dark:bg-stone-900'
      }`}
    >
      <Text
        className={`font-dm-bold text-xs ${
          active ? 'text-primary-foreground' : 'text-foreground dark:text-stone-50'
        }`}
        numberOfLines={1}
      >
        {isExact ? 'Pas' : formatRupiah(amount)}
      </Text>
    </Pressable>
  );
});

export function CheckoutModal({
  visible,
  onClose,
  bottomInset,
  onSuccess,
  onFailed,
  editSaleId,
  isEditMode,
}: {
  visible: boolean;
  onClose: () => void;
  bottomInset: number;
  /** Dipanggil saat server sudah mengonfirmasi transaksi (di background). */
  onSuccess: (sale: Sale) => void;
  /** Dipanggil jika transaksi gagal permanen setelah retry. */
  onFailed?: (message: string) => void;
  editSaleId: number | null;
  isEditMode: boolean;
}) {
  const queryClient = useQueryClient();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const { subtotal, discount, total } = useMemo(() => calcTotals(items), [items]);
  const quick = useMemo(() => quickAmounts(total), [total]);

  const [payment, setPayment] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Lock sinkron: state terlambat satu render, ref tidak.
  const submitLock = useRef(false);
  // Satu key per sesi checkout, dipakai ulang saat retry agar server tidak membuat duplikat.
  const idempotencyKey = useRef<string>('');

  const paymentNum = Number(payment) || 0;
  const change = paymentNum - total;
  const canSubmit = paymentNum >= total && items.length > 0;

  useEffect(() => {
    if (visible) {
      setPayment('');
      setError(null);
      submitLock.current = false;
      idempotencyKey.current = Crypto.randomUUID();
    }
  }, [visible]);

  const handleChangeText = useCallback(
    (t: string) => {
      setPayment(t.replace(/\D/g, ''));
      setError((prev) => (prev ? null : prev));
    },
    [],
  );

  // Throttle untuk tombol nominal cepat (cegah tap beruntun)
  const pickAmount = useThrottledCallback((amount: number) => {
    setPayment(String(amount));
    setError(null);
  }, 250);

  const submit = useCallback(() => {
    if (submitLock.current) return;
    if (items.length === 0) return setError('Keranjang kosong.');
    if (paymentNum < total) return setError('Uang diterima kurang dari total.');

    submitLock.current = true;

    // Snapshot sebelum keranjang dikosongkan
    const payload = {
      items: items.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
      payment_amount: paymentNum,
      client_uuid: idempotencyKey.current,
    };
    const targetId = isEditMode ? editSaleId : null;

    // UI langsung bebas; kasir bisa lanjut transaksi berikutnya
    clear();
    onClose();

    enqueueSale(() => (targetId ? updateSale(targetId, payload) : createSale(payload)))
      .then((sale) => {
        queryClient.invalidateQueries({ queryKey: ['sales'] });
        onSuccess(sale);
      })
      .catch((e) => {
        onFailed?.(getErrorMessage(e));
      });
  }, [items, paymentNum, total, isEditMode, editSaleId, clear, onClose, queryClient, onSuccess, onFailed]);

  // Throttle tombol bayar: tap kedua dalam 1 detik diabaikan
  const handleSubmit = useThrottledCallback(submit, 1000);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/40 px-4">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="w-full items-center"
        >
          <View
            style={{ width: '100%', maxWidth: 460, maxHeight: '100%' }}
            className="overflow-hidden rounded-3xl bg-white dark:bg-stone-900"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-border/40 px-5 py-3.5 dark:border-stone-800/60">
              <View>
                <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
                  {isEditMode ? 'Update Pembayaran' : 'Pembayaran'}
                </Text>
                <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
                  {isEditMode ? 'Konfirmasi perubahan transaksi' : 'Masukkan uang yang diterima'}
                </Text>
              </View>
              <IconButton icon={X} variant="filled" size="sm" onPress={onClose} accessibilityLabel="Tutup" />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, gap: 12 }}
            >
              <SummaryCard items={items} subtotal={subtotal} discount={discount} total={total} />

              {/* Input uang diterima */}
              <View className="gap-3 rounded-2xl border border-border/40 bg-white p-4 dark:border-stone-800/60 dark:bg-stone-900">
                <Text className="font-dm-bold text-xs text-foreground dark:text-stone-50">
                  Uang diterima
                </Text>
                <View className="h-14 flex-row items-center gap-3 rounded-xl border-[1.5px] border-border bg-white px-4 dark:border-stone-700 dark:bg-stone-900">
                  <Icon as={Banknote} size={20} className="text-muted-foreground dark:text-stone-400" />
                  <Text className="font-dm-medium text-base text-muted-foreground dark:text-stone-400">Rp</Text>
                  <TextInput
                    value={payment ? paymentNum.toLocaleString('id-ID') : ''}
                    onChangeText={handleChangeText}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    className="flex-1 py-0 font-dm-bold text-lg text-foreground dark:text-stone-50"
                    autoFocus
                  />
                </View>
                <View className="flex-row flex-wrap justify-evenly gap-2">
                  {quick.map((amount) => (
                    <QuickAmount
                      key={amount}
                      amount={amount}
                      isExact={amount === total}
                      active={paymentNum === amount}
                      onPick={pickAmount}
                    />
                  ))}
                </View>
              </View>

              {/* Kembalian */}
              <View
                className={`overflow-hidden rounded-2xl border ${
                  change >= 0
                    ? 'border-primary/30 bg-primary/5 dark:border-sage-500/30 dark:bg-sage-500/10'
                    : 'border-destructive/30 bg-destructive/5 dark:border-red-500/30 dark:bg-red-500/10'
                }`}
              >
                <View className="flex-row items-center justify-between px-4 py-3.5">
                  <Text
                    className={`font-dm-semibold text-sm ${
                      change >= 0
                        ? 'text-foreground dark:text-stone-50'
                        : 'text-destructive dark:text-red-400'
                    }`}
                  >
                    {change >= 0 ? 'Kembalian' : 'Kurang'}
                  </Text>
                  <Text
                    className={`font-dm-extrabold text-xl leading-none tracking-tight ${
                      change >= 0
                        ? 'text-primary dark:text-sage-400'
                        : 'text-destructive dark:text-red-400'
                    }`}
                  >
                    {formatRupiah(Math.abs(change))}
                  </Text>
                </View>
              </View>

              {error ? (
                <View className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 dark:border-red-500/30 dark:bg-red-500/15">
                  <Text className="font-dm-regular text-xs text-destructive dark:text-red-400">{error}</Text>
                </View>
              ) : null}
            </ScrollView>

            <View
              className="border-t border-border/40 bg-white px-4 pt-3 dark:border-stone-800/60 dark:bg-stone-900"
              style={{ paddingBottom: Math.max(bottomInset, 12) }}
            >
              <Button
                label={isEditMode ? 'Simpan Perubahan' : 'Selesai & Bayar'}
                icon={Check}
                disabled={!canSubmit}
                onPress={handleSubmit}
                fullWidth
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}