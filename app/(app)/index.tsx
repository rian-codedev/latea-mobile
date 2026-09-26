import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  LogOut,
  ShoppingCart,
  Receipt,
  Banknote,
  Package,
  Tag,
  Store as StoreIcon,
  ChevronRight,
  AlertTriangle,
  Clock,
  BarChart3,
  type LucideIcon,
} from 'lucide-react-native';
import { useSession } from '@/lib/session';
import { useProducts } from '@/lib/useProduct';
import {
  fetchSales,
  fetchSaleDetail,
  fetchProductSummary,
  type Sale,
  type SaleListItem,
  type ProductSummaryItem,
} from '@/lib/api-sales';
import { ReceiptModal } from '@/lib/receipt-modal';
import type { ApiProduct } from '@/lib/api-products';
import { formatRupiah } from '@/lib/format';

/* ══════════════════════════════════════════════════════
   Konstanta
   ══════════════════════════════════════════════════════ */
const HEADER_HEIGHT = 60;
const PRODUCT_PREVIEW_LIMIT = 5;
const RECENT_ITEM_HEIGHT = 62;
const RECENT_VISIBLE_ITEMS = 5;
const RECENT_MAX_HEIGHT = RECENT_ITEM_HEIGHT * RECENT_VISIBLE_ITEMS;

const WELCOME_GRADIENT_A = ['#EEF5F0', '#DCEBE1', '#CBDFD3'] as const;
const WELCOME_GRADIENT_B = ['#E9F1F4', '#D8E6EC', '#E4EEE7'] as const;

const WELCOME_GRADIENT_A_DARK = ['#0F1F17', '#0A1712', '#071210'] as const;
const WELCOME_GRADIENT_B_DARK = ['#0A1418', '#091418', '#0A1712'] as const;

/* ── Helper ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

function todayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/* ══════════════════════════════════════════════════════
   Dashboard Screen
   ══════════════════════════════════════════════════════ */
export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user, signOut } = useSession();

  const isWide = width >= 900;
  const storeId = user?.store_id;

  const cashierName = user?.name ?? 'Kasir';
  const storeName = user?.store?.name ?? 'Toko';
  const initial = cashierName.charAt(0).toUpperCase() || 'K';

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const timeLabel = useMemo(
    () =>
      now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [now]
  );

  const dayLabel = useMemo(
    () =>
      now.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }),
    [now]
  );

  const dateFullLabel = useMemo(
    () =>
      now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    [now]
  );

  const { data: products = [] } = useProducts(storeId);

  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active).length,
    [products]
  );
  const promoProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.is_active &&
          p.discount_price != null &&
          p.minimal_discount != null
      ).length,
    [products]
  );

  const today = todayString();

  const { data: salesToday } = useQuery({
    queryKey: ['sales', 'today', storeId, today],
    queryFn: () => fetchSales({ date_from: today, date_to: today }),
    enabled: !!storeId,
  });

  const { data: productSummary = [] } = useQuery({
    queryKey: ['sales', 'product-summary', storeId, today],
    queryFn: () => fetchProductSummary({ date_from: today, date_to: today }),
    enabled: !!storeId,
  });

  const todayStats = useMemo(() => {
    const list = salesToday?.data ?? [];
    const salesTotal = list.reduce((a, s) => a + s.total, 0);
    const transactions = list.length;
    const itemsSold = list.reduce((a, s) => a + (s.total_quantity ?? 0), 0);
    return { salesTotal, transactions, itemsSold };
  }, [salesToday]);

  const recent = useMemo(() => salesToday?.data ?? [], [salesToday]);

  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { data: saleDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['sale', 'detail', selectedSaleId],
    queryFn: () => fetchSaleDetail(selectedSaleId!),
    enabled: !!selectedSaleId,
    staleTime: 1000 * 60 * 5,
  });

  const handleSalePress = useCallback((saleId: number) => {
    setSelectedSaleId(saleId);
  }, []);

  const closeDetail = useCallback(() => {
    setSelectedSaleId(null);
  }, []);

  const openCashier = useCallback(() => {
    router.push('/(app)/cashier');
  }, []);

  const requestLogout = useCallback(() => {
    setLogoutConfirmOpen(true);
  }, []);

  const confirmLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
    } finally {
      setIsLoggingOut(false);
      setLogoutConfirmOpen(false);
    }
  }, [signOut, isLoggingOut]);

  const cancelLogout = useCallback(() => {
    if (isLoggingOut) return;
    setLogoutConfirmOpen(false);
  }, [isLoggingOut]);

  const scrollContentStyle = useMemo(
    () => ({
      paddingTop: insets.top + HEADER_HEIGHT + 16,
      paddingBottom: insets.bottom + 24,
      paddingHorizontal: 16,
    }),
    [insets.top, insets.bottom]
  );

  const headerBlurStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      paddingTop: insets.top,
    }),
    [insets.top]
  );

  return (
    <View className="flex-1 bg-white dark:bg-stone-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
      >
        <View className={isWide ? 'flex-row items-start gap-4' : 'gap-4'}>
          {/* ═══ KOLOM KIRI ═══ */}
          <View className={isWide ? 'flex-[3] gap-4' : 'gap-4'}>
            <StartCard
              onPress={openCashier}
              storeName={storeName}
              activeProducts={activeProducts}
              promoProducts={promoProducts}
              large={isWide}
            />

            <View className="flex-row flex-wrap gap-3">
              <StatCard
                icon={Banknote}
                label="Penjualan hari ini"
                value={formatRupiah(todayStats.salesTotal)}
                wide
              />
              <StatCard
                icon={Receipt}
                label="Transaksi"
                value={String(todayStats.transactions)}
              />
              <StatCard
                icon={Package}
                label="Item terjual"
                value={String(todayStats.itemsSold)}
              />
            </View>
            <ProductSalesCard products={productSummary} />
          </View>

          {/* ═══ KOLOM KANAN ═══ */}
          <View className={isWide ? 'flex-[2] gap-4' : 'gap-4'}>
            <RecentCard sales={recent} onSalePress={handleSalePress} />
            <ProductListCard products={products} />
          </View>
        </View>
      </ScrollView>

      {/* ══ GLASS HEADER ══ */}
      <BlurView
        intensity={70}
        tint={isDark ? 'dark' : 'light'}
        style={headerBlurStyle}
        className="overflow-hidden"
      >
        <View className="absolute bottom-0 left-0 right-0 h-px bg-border/40 dark:bg-stone-800/60" />

        <View
          style={{ height: HEADER_HEIGHT }}
          className="flex-row items-center gap-3 px-4"
        >
          <View className="size-10 items-center justify-center rounded-full bg-primary dark:bg-sage-500">
            <Text className="font-dm-extrabold text-sm text-primary-foreground">
              {initial}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
              {getGreeting()}
            </Text>
            <Text
              className="font-dm-bold text-base leading-tight text-foreground dark:text-stone-50"
              numberOfLines={1}
            >
              {cashierName}
            </Text>
          </View>

          <DateTimePill
            time={timeLabel}
            dayLabel={dayLabel}
            fullDate={dateFullLabel}
            expanded={isWide}
          />

          <Pressable
            onPress={requestLogout}
            hitSlop={8}
            accessibilityLabel="Keluar"
            className="size-10 items-center justify-center rounded-full active:bg-muted/60 dark:active:bg-stone-800/60"
          >
            <Icon
              as={LogOut}
              size={18}
              className="text-muted-foreground dark:text-stone-400"
            />
          </Pressable>
        </View>
      </BlurView>

      {/* ══ DETAIL SALE MODAL — LOADING ══ */}
      <Modal
        visible={!!selectedSaleId && isLoadingDetail}
        transparent
        animationType="fade"
        onRequestClose={closeDetail}
      >
        <View className="flex-1 items-center justify-center bg-black/40">
          <View className="items-center gap-3 rounded-2xl bg-white p-6 dark:bg-stone-900">
            <ActivityIndicator size="large" />
            <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
              Memuat detail transaksi...
            </Text>
          </View>
        </View>
      </Modal>

      {/* ══ DETAIL SALE MODAL — RECEIPT ══ */}
      <ReceiptModal
        sale={saleDetail ?? null}
        visible={!!saleDetail && !isLoadingDetail}
        onClose={closeDetail}
      />

      {/* ══ LOGOUT CONFIRMATION MODAL ══ */}
      <LogoutConfirmModal
        visible={logoutConfirmOpen}
        isLoading={isLoggingOut}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   DateTime Pill
   ══════════════════════════════════════════════════════ */
const DateTimePill = React.memo(function DateTimePill({
  time,
  dayLabel,
  fullDate,
  expanded,
}: {
  time: string;
  dayLabel: string;
  fullDate: string;
  expanded: boolean;
}) {
  if (!expanded) {
    return (
      <View className="flex-row items-center gap-1.5 rounded-full border border-border/40 bg-white/70 px-2.5 py-1.5 dark:border-stone-800/60 dark:bg-stone-900/70">
        <View className="size-1.5 rounded-full bg-primary dark:bg-sage-400" />
        <Text className="font-mono text-[11px] font-bold tracking-tight text-foreground dark:text-stone-50">
          {time}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-2 rounded-full border border-border/40 bg-white/70 px-3 py-1.5 dark:border-stone-800/60 dark:bg-stone-900/70">
      <Icon
        as={Clock}
        size={11}
        className="text-primary dark:text-sage-400"
      />
      <Text className="font-mono text-[11px] font-bold tracking-tight text-foreground dark:text-stone-50">
        {time}
      </Text>
      <View className="h-3 w-px bg-border/60 dark:bg-stone-700/60" />
      <Text className="font-dm-medium text-[10.5px] text-muted-foreground dark:text-stone-400">
        {fullDate}
      </Text>
    </View>
  );
});

/* ══════════════════════════════════════════════════════
   Logout Confirmation Modal
   ══════════════════════════════════════════════════════ */
const LogoutConfirmModal = React.memo(function LogoutConfirmModal({
  visible,
  isLoading,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          disabled={isLoading}
        />

        <View
          style={{ width: '100%', maxWidth: 360 }}
          className="overflow-hidden rounded-3xl bg-white dark:bg-stone-900"
        >
          <View className="items-center gap-3 px-6 pt-6">
            <View className="size-14 items-center justify-center rounded-full bg-destructive/10 dark:bg-red-500/15">
              <Icon
                as={AlertTriangle}
                size={26}
                className="text-destructive dark:text-red-400"
              />
            </View>

            <View className="items-center gap-1">
              <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
                Keluar dari aplikasi?
              </Text>
              <Text className="text-center font-dm-regular text-xs leading-4 text-muted-foreground dark:text-stone-400">
                Anda harus login kembali untuk melanjutkan transaksi.
              </Text>
            </View>
          </View>

          <View className="mt-6 flex-row gap-2 border-t border-border/40 bg-muted/30 p-4 dark:border-stone-800/60 dark:bg-stone-800/30">
            <Pressable
              onPress={onCancel}
              disabled={isLoading}
              className="h-11 flex-1 items-center justify-center rounded-full border border-border/60 bg-white active:opacity-80 dark:border-stone-700/60 dark:bg-stone-900"
            >
              <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
                Batal
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              disabled={isLoading}
              className={
                isLoading
                  ? 'h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-destructive/60 dark:bg-red-500/50'
                  : 'h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-destructive active:opacity-90 dark:bg-red-500'
              }
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="font-dm-bold text-sm text-white">
                    Keluar...
                  </Text>
                </>
              ) : (
                <>
                  <Icon as={LogOut} size={15} className="text-white" />
                  <Text className="font-dm-bold text-sm text-white">
                    Keluar
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/* ══════════════════════════════════════════════════════
   Start Card
   ══════════════════════════════════════════════════════ */
const StartCard = React.memo(function StartCard({
  onPress,
  storeName,
  activeProducts,
  promoProducts,
  large,
}: {
  onPress: () => void;
  storeName: string;
  activeProducts: number;
  promoProducts: number;
  large?: boolean;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const gradientA = isDark ? WELCOME_GRADIENT_A_DARK : WELCOME_GRADIENT_A;
  const gradientB = isDark ? WELCOME_GRADIENT_B_DARK : WELCOME_GRADIENT_B;

  const pressStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => ({
      transform: [{ scale: pressed ? 0.97 : 1 }],
    }),
    []
  );

  return (
    <View
      className={`overflow-hidden rounded-3xl border border-border/40 dark:border-stone-800/60 ${
        large ? 'p-8' : 'p-6'
      }`}
    >
      <LinearGradient
        colors={gradientA}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={gradientB}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
      />

      {/* Orbs — warna conditional */}
      <View
        className="absolute -right-20 -top-20 size-64 rounded-full"
        style={{
          backgroundColor: isDark
            ? 'rgba(132,169,140,0.06)'
            : 'rgba(255,255,255,0.4)',
        }}
      />
      <View
        className="absolute -bottom-24 right-16 size-48 rounded-full"
        style={{
          backgroundColor: isDark
            ? 'rgba(132,169,140,0.04)'
            : 'rgba(255,255,255,0.2)',
        }}
      />

      <View className="relative">
        <Text className="font-dm-medium text-xs text-muted-foreground dark:text-stone-400">
          {storeName}
        </Text>

        <Text
          className={`mt-1 font-dm-extrabold tracking-tight text-foreground dark:text-stone-50 ${
            large ? 'text-4xl' : 'text-3xl'
          }`}
        >
          Mulai transaksi
        </Text>
        <Text className="mt-1.5 max-w-[360px] font-dm-regular text-sm leading-5 text-muted-foreground dark:text-stone-400">
          Pilih produk, hitung total, lalu terima pembayaran.
        </Text>

        <View className="mt-6 flex-row flex-wrap items-center gap-3">
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel="Mulai transaksi"
            style={pressStyle}
            className="h-12 flex-row items-center gap-2 rounded-full bg-primary px-5 active:opacity-90 dark:bg-sage-500"
          >
            <Icon
              as={ShoppingCart}
              size={17}
              className="text-primary-foreground"
            />
            <Text className="font-dm-bold text-sm text-primary-foreground">
              Buka kasir
            </Text>
          </Pressable>

          <View className="flex-row items-center gap-2">
            <Pill icon={Package} text={`${activeProducts} produk aktif`} />
            {promoProducts > 0 ? (
              <Pill icon={Tag} text={`${promoProducts} promo`} />
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
});

/* ══════════════════════════════════════════════════════
   Pill
   ══════════════════════════════════════════════════════ */
const Pill = React.memo(function Pill({
  icon,
  text,
}: {
  icon: LucideIcon;
  text: string;
}) {
  return (
    <View className="h-8 flex-row items-center gap-1.5 rounded-full border border-border/40 bg-white/70 px-3 dark:border-stone-800/60 dark:bg-stone-900/70">
      <Icon
        as={icon}
        size={13}
        className="text-primary dark:text-sage-400"
      />
      <Text className="font-dm-medium text-xs text-foreground dark:text-stone-50">
        {text}
      </Text>
    </View>
  );
});

/* ══════════════════════════════════════════════════════
   Stat Card
   ══════════════════════════════════════════════════════ */
const StatCard = React.memo(function StatCard({
  icon,
  label,
  value,
  wide,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <View
      className={`min-w-[140px] gap-3 rounded-2xl border border-border/40 bg-white p-4 dark:border-stone-800/60 dark:bg-stone-900 ${
        wide ? 'w-full' : 'flex-1'
      }`}
    >
      <View className="size-9 items-center justify-center rounded-xl bg-accent/60 dark:bg-stone-800">
        <Icon
          as={icon}
          size={17}
          className="text-primary dark:text-sage-400"
        />
      </View>
      <View className="gap-0.5">
        <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
          {label}
        </Text>
        <Text
          className="font-dm-extrabold text-2xl leading-tight tracking-tight text-foreground dark:text-stone-50"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
      </View>
    </View>
  );
});

/* ══════════════════════════════════════════════════════
   Product Sales Card
   ══════════════════════════════════════════════════════ */
const ProductSalesCard = React.memo(function ProductSalesCard({
  products,
}: {
  products: ProductSummaryItem[];
}) {
  const isEmpty = products.length === 0;

  const maxQty = useMemo(
    () => Math.max(...products.map((p) => Number(p.total_qty)), 1),
    [products]
  );

  return (
    <View className="overflow-hidden rounded-xl border border-border/40 bg-white dark:border-stone-800/60 dark:bg-stone-900">
      <View className="flex-row items-center justify-between border-b border-border/40 px-4 py-3 dark:border-stone-800/60">
        <View className="flex-row items-center gap-2.5">
          <View className="size-7 items-center justify-center rounded-lg bg-primary/10 dark:bg-sage-500/15">
            <Icon
              as={Package}
              size={14}
              className="text-primary dark:text-sage-400"
            />
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

        <View className="rounded-full bg-muted px-2 py-0.5 dark:bg-stone-800">
          <Text className="font-mono text-[10px] font-bold text-muted-foreground dark:text-stone-400">
            {products.length}
          </Text>
        </View>
      </View>

      {isEmpty ? (
        <View className="items-center gap-2 px-4 py-10">
          <Text className="text-3xl">📊</Text>
          <Text className="text-center font-dm-medium text-xs text-muted-foreground dark:text-stone-400">
            Belum ada produk terjual hari ini
          </Text>
        </View>
      ) : (
        <View>
          {products.map((product, index) => {
            const qty = Number(product.total_qty);
            const percentage = (qty / maxQty) * 100;

            return (
              <View
                key={product.product_id}
                className={`flex-row items-center gap-3 px-4 py-2.5 ${
                  index < products.length - 1
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
        </View>
      )}
    </View>
  );
});

/* ══════════════════════════════════════════════════════
   Recent Card
   ══════════════════════════════════════════════════════ */
const RecentCard = React.memo(function RecentCard({
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
      <View className="flex-row items-center justify-between border-b border-border/40 px-4 py-3 dark:border-stone-800/60">
        <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
          Transaksi hari ini
        </Text>
        {!isEmpty ? (
          <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 dark:bg-sage-500">
            <Text className="font-dm-bold text-[11px] text-primary-foreground">
              {sales.length}
            </Text>
          </View>
        ) : (
          <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            —
          </Text>
        )}
      </View>

      {isEmpty ? (
        <View className="items-center gap-1 px-4 py-10">
          <Text className="text-3xl">🧾</Text>
          <Text className="font-dm-semibold text-sm text-foreground dark:text-stone-50">
            Belum ada transaksi
          </Text>
          <Text className="text-center font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            Transaksi hari ini akan muncul di sini
          </Text>
        </View>
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
                <View className="size-10 items-center justify-center rounded-full bg-accent/60 dark:bg-stone-800">
                  <Icon
                    as={Receipt}
                    size={16}
                    className="text-primary dark:text-sage-400"
                  />
                </View>

                <View className="flex-1">
                  <Text className="font-dm-semibold text-[13px] text-foreground dark:text-stone-50">
                    #{shortId}
                  </Text>
                  <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
                    {formatTime(t.sale_date)} WIB, {t.items_count} item
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
            Scroll untuk melihat {sales.length - RECENT_VISIBLE_ITEMS} lainnya
          </Text>
        </View>
      ) : null}
    </View>
  );
});

function ProductImage({
  uri,
  emoji,
  size = 48,
}: {
  uri: string | null;
  emoji: string | null;
  size?: number;
}) {
  const [failed, setFailed] = React.useState(false);

  const showImage = uri && !failed;
  return (
    <View
      style={{ width: size, height: size }}
      className="items-center justify-center overflow-hidden rounded-xl border border-border/40 bg-accent/60 dark:border-stone-800/60 dark:bg-stone-800"
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ fontSize: size * 0.5 }}>{emoji ?? '📦'}</Text>
      )}
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Product List Card
   ══════════════════════════════════════════════════════ */
const ProductListCard = React.memo(function ProductListCard({
  products,
}: {
  products: ApiProduct[];
}) {
  const isEmpty = products.length === 0;
  const preview = products.slice(0, PRODUCT_PREVIEW_LIMIT);
  const remaining = products.length - preview.length;
  return (
    <View className="overflow-hidden rounded-2xl border border-border/40 bg-white dark:border-stone-800/60 dark:bg-stone-900">
      <View className="flex-row items-center justify-between border-b border-border/40 px-4 py-3 dark:border-stone-800/60">
        <View className="flex-row items-center gap-2">
          <Icon
            as={StoreIcon}
            size={15}
            className="text-primary dark:text-sage-400"
          />
          <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
            Produk di toko Anda
          </Text>
        </View>
        {!isEmpty ? (
          <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 dark:bg-sage-500">
            <Text className="font-dm-bold text-[11px] text-primary-foreground">
              {products.length}
            </Text>
          </View>
        ) : null}
      </View>

      {isEmpty ? (
        <View className="items-center gap-1 px-4 py-10">
          <Text className="text-3xl">📦</Text>
          <Text className="font-dm-semibold text-sm text-foreground dark:text-stone-50">
            Belum ada produk
          </Text>
          <Text className="text-center font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            Admin belum meng-assign produk ke toko Anda
          </Text>
        </View>
      ) : (
        <>
          {preview.map((p, i) => {
            const hasPromo =
              p.discount_price != null && p.minimal_discount != null;
            const displayPrice = hasPromo ? p.discount_price! : p.price;

            return (
              <View
                key={p.id}
                className={`flex-row items-center gap-3 px-4 py-2.5 ${
                  i < preview.length - 1 || remaining > 0
                    ? 'border-b border-border/30 dark:border-stone-800/40'
                    : ''
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

          {remaining > 0 ? (
            <View className="bg-muted/30 px-4 py-2.5 dark:bg-stone-800/30">
              <Text className="text-center font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
                dan {remaining} produk lainnya
              </Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
});