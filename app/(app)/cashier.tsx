import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  ArrowLeft,
  Search,
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ChevronUp,
  Banknote,
  Check,
} from 'lucide-react-native';
import { useProducts } from '@/lib/useProduct';
import { createSale, type Sale } from '@/lib/api-sales';
import { getErrorMessage } from '@/lib/api';
import { ReceiptModal } from '@/lib/receipt-modal';
import type { ApiProduct } from '@/lib/api-products';
import {
  useCart,
  effectivePrice,
  calcTotals,
  type CartItem,
} from '@/lib/cart';
import { formatRupiah } from '@/lib/format';
import { useSession } from '@/lib/session';

/* ── Konstanta ── */
const HEADER_HEIGHT = 60;
const CARD_HEIGHT = 188;
const IMAGE_HEIGHT = 104;
const CART_BAR_HEIGHT = 64;

const SOFT_GRADIENT_A = ['#EEF5F0', '#DCEBE1', '#CBDFD3'] as const;
const SOFT_GRADIENT_B = ['#E9F1F4', '#D8E6EC', '#E4EEE7'] as const;

/* ── Types ── */
type GridItem = ApiProduct | { id: string; spacer: true };

function isSpacer(item: GridItem): item is { id: string; spacer: true } {
  return 'spacer' in item && item.spacer === true;
}

/* ══════════════════════════════════════════════════════
   Cashier Screen
   ══════════════════════════════════════════════════════ */
export default function CashierScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const { user } = useSession();
  const {
    data: apiProducts = [],
    isLoading,
    error,
    refetch,
  } = useProducts(user?.store_id);
  const isTablet = width >= 768;
  const isLandscape = width > 900;
  const cols = isLandscape ? 4 : isTablet ? 3 : 2;

  const addItem = useCart((s) => s.addItem);
  const items = useCart((s) => s.items);

  const { total } = calcTotals(items);
  const itemCount = items.reduce((a, i) => a + i.quantity, 0);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)');
  }, []);

  const qtyMap = useMemo(() => {
    const m = new Map<number, number>();
    items.forEach((i) => m.set(i.productId, i.quantity));
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apiProducts.filter((p) => {
      if (!p.is_active) return false;
      if (q && !`${p.name} ${p.code}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [apiProducts, search]);

  const gridData = useMemo<GridItem[]>(() => {
    const rem = filtered.length % cols;
    if (rem === 0) return filtered;
    const spacers = Array.from({ length: cols - rem }, (_, i) => ({
      id: `spacer-${i}`,
      spacer: true as const,
    }));
    return [...filtered, ...spacers];
  }, [filtered, cols]);

  function handleAdd(p: ApiProduct) {
    addItem({
      productId: p.id,
      name: p.name,
      code: p.code,
      emoji: p.emoji ?? '📦',
      imageUrl: p.image_url,
      price: p.price,
      discountPrice: p.discount_price,
      minimalDiscount: p.minimal_discount,
    });
  }

  function openCheckout() {
    if (items.length === 0) return;
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  return (
    <View className="flex-1 bg-white">
      {/* ══ AREA KONTEN ══ */}
      <View
        className="flex-1 flex-row"
        style={{ paddingTop: insets.top + HEADER_HEIGHT }}
      >
        {/* ═══ KIRI: Katalog ═══ */}
        <View
          className={isTablet ? 'flex-[7] border-r border-border/40' : 'flex-1'}
        >
          {/* Search */}
          <View className="bg-white px-3 pb-2 pt-3">
            <View className="h-11 flex-row items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-4">
              <Icon as={Search} size={16} className="text-muted-foreground" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Cari nama atau kode produk"
                placeholderTextColor="#9CA3AF"
                className="flex-1 py-0 font-dm-regular text-sm text-foreground"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {search.length > 0 ? (
                <Pressable
                  onPress={() => setSearch('')}
                  hitSlop={10}
                  accessibilityLabel="Hapus pencarian"
                >
                  <Icon as={X} size={16} className="text-muted-foreground" />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Grid Produk */}
          <FlatList
            key={`cols-${cols}`}
            data={gridData}
            keyExtractor={(p) => String(p.id)}
            numColumns={cols}
            columnWrapperStyle={{ gap: 10 }}
            contentContainerStyle={{
              padding: 12,
              gap: 10,
              paddingBottom: isTablet
                ? 24
                : CART_BAR_HEIGHT + insets.bottom + 32,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              if (isSpacer(item)) {
                return <View className="flex-1" style={{ height: CARD_HEIGHT }} />;
              }
              return (
                <ProductButton
                  product={item}
                  qty={qtyMap.get(item.id) ?? 0}
                  onPress={() => handleAdd(item)}
                />
              );
            }}
            ListEmptyComponent={
              isLoading ? (
                <View className="items-center justify-center gap-2 py-16">
                  <ActivityIndicator size="large" />
                  <Text className="font-dm-regular text-xs text-muted-foreground">
                    Memuat produk...
                  </Text>
                </View>
              ) : error ? (
                <View className="items-center justify-center gap-2 py-16">
                  <Text className="text-3xl">⚠️</Text>
                  <Text className="font-dm-semibold text-sm text-foreground">
                    Gagal memuat produk
                  </Text>
                  <Pressable
                    onPress={() => refetch()}
                    className="mt-1 rounded-full bg-primary px-4 py-2"
                  >
                    <Text className="font-dm-bold text-xs text-primary-foreground">
                      Coba Lagi
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View className="items-center justify-center gap-1 py-16">
                  <Text className="text-3xl">🔍</Text>
                  <Text className="font-dm-semibold text-sm text-foreground">
                    Produk tidak ditemukan
                  </Text>
                  <Text className="font-dm-regular text-xs text-muted-foreground">
                    Coba kata kunci atau kode produk lain
                  </Text>
                </View>
              )
            }
          />
        </View>

        {/* ═══ KANAN: Keranjang (tablet) ═══ */}
        {isTablet ? (
          <View className="flex-[3] bg-white">
            <CartPanel bottomInset={insets.bottom} onCheckout={openCheckout} />
          </View>
        ) : null}
      </View>

      {/* ══ GLASS HEADER ══ */}
      <BlurView
        intensity={70}
        tint="light"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          paddingTop: insets.top,
        }}
        className="overflow-hidden"
      >
        <View className="absolute bottom-0 left-0 right-0 h-px bg-border/40" />

        <View
          style={{ height: HEADER_HEIGHT }}
          className="flex-row items-center gap-3 px-3"
        >
          <Pressable
            onPress={handleBack}
            hitSlop={8}
            accessibilityLabel="Kembali"
            className="size-10 items-center justify-center rounded-full active:bg-muted/60"
          >
            <Icon as={ArrowLeft} size={20} className="text-foreground" />
          </Pressable>

          <View className="flex-1">
            <Text className="font-dm-bold text-base text-foreground">
              Kasir
            </Text>
            <Text className="font-dm-regular text-xs text-muted-foreground">
              Tap produk untuk menambah ke keranjang
            </Text>
          </View>
        </View>
      </BlurView>

      {/* ══ PONSEL: floating cart bar ══ */}
      {!isTablet && itemCount > 0 ? (
        <View
          className="absolute bottom-0 left-0 right-0 px-3"
          style={{ paddingBottom: insets.bottom + 12 }}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={() => setCartOpen(true)}
            style={{ height: CART_BAR_HEIGHT }}
            className="overflow-hidden rounded-full border border-border/40 active:opacity-90"
          >
            <LinearGradient
              colors={SOFT_GRADIENT_A}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={SOFT_GRADIENT_B}
              start={{ x: 1, y: 0 }}
              end={{ x: 0, y: 0 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
            />

            <View className="h-full flex-row items-center justify-between px-2">
              <View className="flex-row items-center gap-3">
                <View className="size-10 items-center justify-center rounded-full bg-primary">
                  <Icon
                    as={ShoppingCart}
                    size={18}
                    className="text-primary-foreground"
                  />
                </View>
                <View>
                  <Text className="font-dm-regular text-[11px] text-muted-foreground">
                    {itemCount} item
                  </Text>
                  <Text className="font-dm-extrabold text-base leading-tight tracking-tight text-foreground">
                    {formatRupiah(total)}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1 pr-3">
                <Text className="font-dm-bold text-sm text-primary">
                  Lihat keranjang
                </Text>
                <Icon as={ChevronUp} size={18} className="text-primary" />
              </View>
            </View>
          </Pressable>
        </View>
      ) : null}

      {/* ══ PONSEL: Modal Keranjang ══ */}
      {!isTablet ? (
        <Modal
          visible={cartOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setCartOpen(false)}
        >
          <View className="flex-1 justify-end bg-black/40">
            <Pressable className="flex-1" onPress={() => setCartOpen(false)} />
            <View
              className="overflow-hidden rounded-t-3xl bg-white"
              style={{ height: '78%' }}
            >
              <View className="items-center pt-2">
                <View className="h-1 w-10 rounded-full bg-border" />
              </View>
              <CartPanel
                bottomInset={insets.bottom}
                onClose={() => setCartOpen(false)}
                onCheckout={openCheckout}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      {/* ══ CHECKOUT MODAL ══ */}
      <CheckoutModal
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        bottomInset={insets.bottom}
        onSuccess={(sale) => {
          setCheckoutOpen(false);
          setTimeout(() => setReceiptSale(sale), 250);
        }}
      />

      {/* ══ RECEIPT MODAL ══ */}
      <ReceiptModal
        sale={receiptSale}
        visible={!!receiptSale}
        onClose={() => {
          setReceiptSale(null);
        }}
      />
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Product Button
   ══════════════════════════════════════════════════════ */
function ProductButton({
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
        height: CARD_HEIGHT,
        transform: [{ scale: pressed ? 0.97 : 1 }],
      })}
      className={`flex-1 overflow-hidden rounded-2xl border-[1.5px] bg-white ${
        inCart ? 'border-primary' : 'border-border/40'
      }`}
    >
      <View
        style={{ height: IMAGE_HEIGHT }}
        className="items-center justify-center overflow-hidden"
      >
        <View className="absolute inset-0 bg-accent/60" />

        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Text className="text-[46px] leading-none">
            {product.emoji ?? '📦'}
          </Text>
        )}

        <View className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5">
          <Text className="font-dm-bold text-[10px] tracking-wide text-foreground">
            {product.code}
          </Text>
        </View>

        {inCart ? (
          <View className="absolute right-2 top-2 h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-1.5">
            <Text className="font-dm-bold text-[11px] text-primary-foreground">
              {qty}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="flex-1 justify-between p-2.5">
        <Text
          className="font-dm-bold text-[13px] leading-tight text-foreground"
          numberOfLines={1}
        >
          {product.name}
        </Text>

        <View className="gap-1">
          <View className="flex-row items-baseline">
            <Text className="mr-0.5 font-dm-medium text-[10px] text-muted-foreground">
              Rp
            </Text>
            <Text className="font-dm-extrabold text-base leading-none tracking-tight text-foreground">
              {Number(product.price).toLocaleString('id-ID')}
            </Text>
          </View>

          {hasPromo ? (
            <View className="self-start rounded-md bg-destructive/10 px-1.5 py-0.5">
              <Text className="font-dm-semibold text-[10px] text-destructive">
                ≥{product.minimal_discount} pcs:{' '}
                {formatRupiah(product.discount_price!)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/* ══════════════════════════════════════════════════════
   Cart Panel
   ══════════════════════════════════════════════════════ */
function CartPanel({
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
      <View className="flex-row items-center justify-between border-b border-border/40 px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Icon as={ShoppingCart} size={17} className="text-primary" />
          <Text className="font-dm-bold text-sm text-foreground">
            Keranjang
          </Text>
          {itemCount > 0 ? (
            <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5">
              <Text className="font-dm-bold text-[11px] text-primary-foreground">
                {itemCount}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row items-center gap-3">
          {!isEmpty ? (
            <Pressable onPress={clear} hitSlop={8}>
              <Text className="font-dm-semibold text-xs text-destructive">
                Kosongkan
              </Text>
            </Pressable>
          ) : null}
          {onClose ? (
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityLabel="Tutup keranjang"
              className="size-8 items-center justify-center rounded-full bg-muted active:opacity-70"
            >
              <Icon as={X} size={16} className="text-foreground" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View className="flex-1">
        {isEmpty ? (
          <View className="flex-1 items-center justify-center gap-1.5 p-6">
            <Text className="text-4xl">🛒</Text>
            <Text className="font-dm-semibold text-sm text-foreground">
              Keranjang kosong
            </Text>
            <Text className="text-center font-dm-regular text-xs text-muted-foreground">
              Tap produk di katalog untuk menambahkannya
            </Text>
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
        className="border-t border-border/40 bg-muted/40 px-4 pt-3"
        style={{ paddingBottom: Math.max(bottomInset, 12) }}
      >
        <View className="mb-3 gap-1.5">
          <View className="flex-row justify-between">
            <Text className="font-dm-regular text-xs text-muted-foreground">
              Subtotal
            </Text>
            <Text className="font-dm-medium text-xs text-foreground">
              {formatRupiah(subtotal)}
            </Text>
          </View>

          {discount > 0 ? (
            <View className="flex-row justify-between">
              <Text className="font-dm-regular text-xs text-destructive">
                Diskon
              </Text>
              <Text className="font-dm-medium text-xs text-destructive">
                -{formatRupiah(discount)}
              </Text>
            </View>
          ) : null}

          <View className="my-1 h-px bg-border/60" />

          <View className="flex-row items-center justify-between">
            <Text className="font-dm-bold text-sm text-foreground">Total</Text>
            <Text className="font-dm-extrabold text-xl leading-none tracking-tight text-primary">
              {formatRupiah(total)}
            </Text>
          </View>
        </View>

        <Pressable
          disabled={isEmpty}
          onPress={onCheckout}
          className={
            isEmpty
              ? 'h-12 items-center justify-center rounded-full bg-muted'
              : 'h-12 items-center justify-center rounded-full bg-primary active:opacity-90'
          }
        >
          <Text
            className={
              isEmpty
                ? 'font-dm-bold text-sm text-muted-foreground'
                : 'font-dm-bold text-sm text-primary-foreground'
            }
          >
            Bayar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Cart Row
   ══════════════════════════════════════════════════════ */
function CartRow({
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
    <View className="flex-row gap-2.5 border-b border-border/30 py-3">
      <View className="size-11 items-center justify-center overflow-hidden rounded-xl bg-accent/60">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <Text className="text-xl">{item.emoji}</Text>
        )}
      </View>

      <View className="flex-1 gap-2">
        <View>
          <Text
            className="font-dm-semibold text-[13px] leading-tight text-foreground"
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <View className="mt-0.5 flex-row items-center gap-1.5">
            <Text className="font-dm-regular text-xs text-muted-foreground">
              {formatRupiah(ep)}
            </Text>
            {promoActive ? (
              <View className="rounded bg-destructive/10 px-1 py-px">
                <Text className="font-dm-bold text-[9px] text-destructive">
                  PROMO
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={onDec}
            hitSlop={4}
            accessibilityLabel="Kurangi jumlah"
            className="size-8 items-center justify-center rounded-lg border border-border/60 bg-white active:bg-muted"
          >
            <Icon as={Minus} size={14} className="text-foreground" />
          </Pressable>
          <Text className="min-w-[28px] text-center font-dm-bold text-sm text-foreground">
            {item.quantity}
          </Text>
          <Pressable
            onPress={onInc}
            hitSlop={4}
            accessibilityLabel="Tambah jumlah"
            className="size-8 items-center justify-center rounded-lg border border-border/60 bg-white active:bg-muted"
          >
            <Icon as={Plus} size={14} className="text-foreground" />
          </Pressable>
        </View>
      </View>

      <View className="items-end justify-between">
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityLabel="Hapus dari keranjang"
          className="p-0.5"
        >
          <Icon as={Trash2} size={15} className="text-destructive/70" />
        </Pressable>
        <Text className="font-dm-bold text-[13px] text-foreground">
          {formatRupiah(lineTotal)}
        </Text>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Checkout Modal
   ══════════════════════════════════════════════════════ */
function quickAmounts(total: number): number[] {
  const roundTo = (n: number, mult: number) => Math.ceil(n / mult) * mult;
  return [
    total,
    roundTo(total, 5000),
    roundTo(total, 10000),
    roundTo(total, 50000),
    roundTo(total, 100000),
  ].filter((v, i, arr) => arr.indexOf(v) === i);
}

function CheckoutModal({
  visible,
  onClose,
  bottomInset,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  bottomInset: number;
  onSuccess: (sale: Sale) => void;
}) {
  const queryClient = useQueryClient();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const { subtotal, discount, total } = calcTotals(items);

  const [payment, setPayment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentNum = Number(payment.replace(/\D/g, '')) || 0;
  const change = paymentNum - total;
  const canSubmit =
    paymentNum >= total && items.length > 0 && !isSubmitting;

  const quick = useMemo(() => quickAmounts(total), [total]);

  useEffect(() => {
    if (visible) {
      setPayment('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [visible]);

  async function handleSubmit() {
    if (items.length === 0) {
      setError('Keranjang kosong.');
      return;
    }
    if (paymentNum < total) {
      setError('Uang diterima kurang dari total.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const sale = await createSale({
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
        payment_amount: paymentNum,
      });
      // Refresh riwayat transaksi (kalau ada screen history)
      queryClient.invalidateQueries({ queryKey: ['sales'] });

      // Bersihkan cart
      clear();

      // Callback ke parent untuk tampilkan struk
      onSuccess(sale);
    } catch (e) {
      setError(getErrorMessage(e));
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-4">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full items-center"
        >
          <View
            style={{
              width: '100%',
              maxWidth: 460,
              maxHeight: '100%',
            }}
            className="overflow-hidden rounded-3xl bg-white"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-border/40 px-5 py-3.5">
              <View>
                <Text className="font-dm-bold text-base text-foreground">
                  Pembayaran
                </Text>
                <Text className="font-dm-regular text-xs text-muted-foreground">
                  Masukkan uang yang diterima
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                disabled={isSubmitting}
                hitSlop={8}
                accessibilityLabel="Tutup"
                className="size-8 items-center justify-center rounded-full bg-muted active:opacity-70"
              >
                <Icon as={X} size={16} className="text-foreground" />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 16, gap: 12 }}
            >
              {/* Ringkasan item */}
              <View className="overflow-hidden rounded-2xl border border-border/40 bg-white">
                <View className="border-b border-border/40 px-4 py-2.5">
                  <Text className="font-dm-bold text-xs text-foreground">
                    Ringkasan · {items.length} item
                  </Text>
                </View>

                <View className="px-4">
                  {items.map((item) => {
                    const ep = effectivePrice(item);
                    const lineTotal = ep * item.quantity;

                    return (
                      <View
                        key={item.productId}
                        className="flex-row items-center gap-3 border-b border-border/30 py-2.5 last:border-b-0"
                      >
                        <View className="size-8 items-center justify-center overflow-hidden rounded-lg bg-accent/60">
                          {item.imageUrl ? (
                            <Image
                              source={{ uri: item.imageUrl }}
                              style={{ width: '100%', height: '100%' }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text className="text-sm">{item.emoji}</Text>
                          )}
                        </View>

                        <View className="flex-1">
                          <Text
                            className="font-dm-semibold text-[12px] text-foreground"
                            numberOfLines={1}
                          >
                            {item.name}
                          </Text>
                          <Text className="font-dm-regular text-[10px] text-muted-foreground">
                            {item.quantity} × {formatRupiah(ep)}
                          </Text>
                        </View>

                        <Text className="font-dm-bold text-[12px] text-foreground">
                          {formatRupiah(lineTotal)}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <View className="gap-1.5 border-t border-border/40 bg-muted/30 px-4 py-3">
                  <View className="flex-row justify-between">
                    <Text className="font-dm-regular text-xs text-muted-foreground">
                      Subtotal
                    </Text>
                    <Text className="font-dm-medium text-xs text-foreground">
                      {formatRupiah(subtotal)}
                    </Text>
                  </View>

                  {discount > 0 ? (
                    <View className="flex-row justify-between">
                      <Text className="font-dm-regular text-xs text-destructive">
                        Diskon
                      </Text>
                      <Text className="font-dm-medium text-xs text-destructive">
                        -{formatRupiah(discount)}
                      </Text>
                    </View>
                  ) : null}

                  <View className="my-1 h-px bg-border/60" />

                  <View className="flex-row items-center justify-between">
                    <Text className="font-dm-bold text-sm text-foreground">
                      Total
                    </Text>
                    <Text className="font-dm-extrabold text-2xl leading-none tracking-tight text-primary">
                      {formatRupiah(total)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Input uang diterima */}
              <View className="gap-3 rounded-2xl border border-border/40 bg-white p-4">
                <Text className="font-dm-bold text-xs text-foreground">
                  Uang diterima
                </Text>

                <View className="h-14 flex-row items-center gap-3 rounded-xl border-[1.5px] border-border bg-white px-4">
                  <Icon
                    as={Banknote}
                    size={20}
                    className="text-muted-foreground"
                  />
                  <Text className="font-dm-medium text-base text-muted-foreground">
                    Rp
                  </Text>
                  <TextInput
                    value={
                      payment ? Number(payment).toLocaleString('id-ID') : ''
                    }
                    onChangeText={(t) => {
                      setPayment(t.replace(/\D/g, ''));
                      if (error) setError(null);
                    }}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    editable={!isSubmitting}
                    className="flex-1 py-0 font-dm-bold text-lg text-foreground"
                    autoFocus
                  />
                </View>

                <View className="flex-row flex-wrap gap-2">
                  {quick.map((amount) => {
                    const isExact = amount === total;
                    const active = paymentNum === amount;

                    return (
                      <Pressable
                        key={amount}
                        onPress={() => {
                          setPayment(String(amount));
                          if (error) setError(null);
                        }}
                        disabled={isSubmitting}
                        className={`h-9 flex-row items-center gap-1 rounded-full border px-3.5 active:opacity-80 ${
                          active
                            ? 'border-primary bg-primary'
                            : 'border-border/60 bg-white'
                        }`}
                      >
                        <Text
                          className={`font-dm-bold text-xs ${
                            active
                              ? 'text-primary-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {isExact ? 'Pas' : formatRupiah(amount)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Kembalian */}
              <View
                className={`overflow-hidden rounded-2xl border ${
                  change >= 0
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-destructive/30 bg-destructive/5'
                }`}
              >
                <View className="flex-row items-center justify-between px-4 py-3.5">
                  <Text
                    className={`font-dm-semibold text-sm ${
                      change >= 0 ? 'text-foreground' : 'text-destructive'
                    }`}
                  >
                    {change >= 0 ? 'Kembalian' : 'Kurang'}
                  </Text>
                  <Text
                    className={`font-dm-extrabold text-xl leading-none tracking-tight ${
                      change >= 0 ? 'text-primary' : 'text-destructive'
                    }`}
                  >
                    {formatRupiah(Math.abs(change))}
                  </Text>
                </View>
              </View>

              {error ? (
                <View className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5">
                  <Text className="font-dm-regular text-xs text-destructive">
                    {error}
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            {/* Footer */}
            <View
              className="border-t border-border/40 bg-white px-4 pt-3"
              style={{ paddingBottom: Math.max(bottomInset, 12) }}
            >
              <Pressable
                onPress={handleSubmit}
                disabled={!canSubmit}
                className={
                  canSubmit
                    ? 'h-12 flex-row items-center justify-center gap-2 rounded-full bg-primary active:opacity-90'
                    : 'h-12 flex-row items-center justify-center gap-2 rounded-full bg-muted'
                }
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text className="font-dm-bold text-sm text-primary-foreground">
                      Memproses...
                    </Text>
                  </>
                ) : (
                  <>
                    <Icon
                      as={Check}
                      size={17}
                      className={
                        canSubmit
                          ? 'text-primary-foreground'
                          : 'text-muted-foreground'
                      }
                    />
                    <Text
                      className={
                        canSubmit
                          ? 'font-dm-bold text-sm text-primary-foreground'
                          : 'font-dm-bold text-sm text-muted-foreground'
                      }
                    >
                      Selesai &amp; Bayar
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}