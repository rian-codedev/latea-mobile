import React, { useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  LogOut,
  ShoppingCart,
  Receipt,
  Banknote,
  Package,
  Tag,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { MOCK_PRODUCTS } from '@/mock/products';
import { formatRupiah } from '@/lib/format';

/* ══════════════════════════════════════════════════════
   Konstanta
   ══════════════════════════════════════════════════════ */
const HEADER_HEIGHT = 60;

const CASHIER_NAME = 'Kasir';
const STORE_NAME = 'Toko Anda';

const TODAY = { sales: 1250000, transactions: 18, itemsSold: 64 };
const RECENT = [
  { id: '0018', time: '14:32', items: 3, total: 82000 },
  { id: '0017', time: '14:10', items: 1, total: 22000 },
  { id: '0016', time: '13:47', items: 5, total: 146000 },
  { id: '0015', time: '13:20', items: 2, total: 54000 },
  { id: '0014', time: '12:58', items: 4, total: 98000 },
];

const ACTIVE_PRODUCTS = MOCK_PRODUCTS.filter((p) => p.isActive).length;
const PROMO_PRODUCTS = MOCK_PRODUCTS.filter(
  (p) => p.isActive && p.discountPrice != null && p.minimalDiscount != null
).length;

const DATE_LABEL = new Date().toLocaleDateString('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const WELCOME_GRADIENT_A = ['#EEF5F0', '#DCEBE1', '#CBDFD3'] as const;
const WELCOME_GRADIENT_B = ['#E9F1F4', '#D8E6EC', '#E4EEE7'] as const;

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

/* ══════════════════════════════════════════════════════
   Dashboard Screen
   ══════════════════════════════════════════════════════ */
export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isWide = width >= 900;

  const openCashier = useCallback(() => {
    router.push('/(app)/cashier');
  }, []);

  const handleLogout = useCallback(() => {
    // TODO: hapus sesi lalu arahkan ke halaman login
  }, []);

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
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
      >
        <View className={isWide ? 'flex-row items-start gap-4' : 'gap-4'}>
          <View className={isWide ? 'flex-[3] gap-4' : 'gap-4'}>
            <StartCard
              onPress={openCashier}
              activeProducts={ACTIVE_PRODUCTS}
              promoProducts={PROMO_PRODUCTS}
              large={isWide}
            />

            <View className="flex-row flex-wrap gap-3">
              <StatCard
                icon={Banknote}
                label="Penjualan hari ini"
                value={formatRupiah(TODAY.sales)}
                wide
              />
              <StatCard
                icon={Receipt}
                label="Transaksi"
                value={String(TODAY.transactions)}
              />
              <StatCard
                icon={Package}
                label="Item terjual"
                value={String(TODAY.itemsSold)}
              />
            </View>
          </View>

          <View className={isWide ? 'flex-[2]' : ''}>
            <RecentCard />
          </View>
        </View>
      </ScrollView>

      {/* ══ GLASS HEADER ══ */}
      <BlurView
        intensity={70}
        tint="light"
        style={headerBlurStyle}
        className="overflow-hidden"
      >
        <View className="absolute bottom-0 left-0 right-0 h-px bg-border/40" />

        <View
          style={{ height: HEADER_HEIGHT }}
          className="flex-row items-center gap-3 px-4"
        >
          <View className="size-10 items-center justify-center rounded-full bg-primary">
            <Text className="font-dm-extrabold text-sm text-primary-foreground">
              {CASHIER_NAME.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="font-dm-regular text-xs text-muted-foreground">
              {getGreeting()}
            </Text>
            <Text
              className="font-dm-bold text-base leading-tight text-foreground"
              numberOfLines={1}
            >
              {CASHIER_NAME}
            </Text>
          </View>

          {isWide ? (
            <Text className="font-dm-regular text-xs text-muted-foreground">
              {DATE_LABEL}
            </Text>
          ) : null}

          <Pressable
            onPress={handleLogout}
            hitSlop={8}
            accessibilityLabel="Keluar"
            className="size-10 items-center justify-center rounded-full active:bg-muted/60"
          >
            <Icon as={LogOut} size={18} className="text-muted-foreground" />
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Start Card
   ══════════════════════════════════════════════════════ */
const StartCard = React.memo(function StartCard({
  onPress,
  activeProducts,
  promoProducts,
  large,
}: {
  onPress: () => void;
  activeProducts: number;
  promoProducts: number;
  large?: boolean;
}) {
  const pressStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => ({
      transform: [{ scale: pressed ? 0.985 : 1 }],
    }),
    []
  );

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Mulai transaksi"
      style={pressStyle}
      className={`overflow-hidden rounded-3xl border border-border/40 ${
        large ? 'p-8' : 'p-6'
      }`}
    >
      <LinearGradient
        colors={WELCOME_GRADIENT_A}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={WELCOME_GRADIENT_B}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
      />

      <View className="absolute -right-20 -top-20 size-64 rounded-full bg-white/40" />
      <View className="absolute -bottom-24 right-16 size-48 rounded-full bg-white/20" />

      <View className="relative">
        <Text className="font-dm-medium text-xs text-muted-foreground">
          {STORE_NAME}
        </Text>

        <Text
          className={`mt-1 font-dm-extrabold tracking-tight text-foreground ${
            large ? 'text-4xl' : 'text-3xl'
          }`}
        >
          Mulai transaksi
        </Text>
        <Text className="mt-1.5 max-w-[360px] font-dm-regular text-sm leading-5 text-muted-foreground">
          Pilih produk, hitung total, lalu terima pembayaran.
        </Text>

        <View className="mt-6 flex-row flex-wrap items-center gap-3">
          <View className="h-12 flex-row items-center gap-2 rounded-full bg-primary px-5">
            <Icon
              as={ShoppingCart}
              size={17}
              className="text-primary-foreground"
            />
            <Text className="font-dm-bold text-sm text-primary-foreground">
              Buka kasir
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Pill icon={Package} text={`${activeProducts} produk aktif`} />
            {promoProducts > 0 ? (
              <Pill icon={Tag} text={`${promoProducts} promo`} />
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
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
    <View className="h-8 flex-row items-center gap-1.5 rounded-full border border-border/40 bg-white/70 px-3">
      <Icon as={icon} size={13} className="text-primary" />
      <Text className="font-dm-medium text-xs text-foreground">{text}</Text>
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
      className={`min-w-[140px] gap-3 rounded-2xl border border-border/40 bg-white p-4 ${
        wide ? 'w-full' : 'flex-1'
      }`}
    >
      <View className="size-9 items-center justify-center rounded-xl bg-accent/60">
        <Icon as={icon} size={17} className="text-primary" />
      </View>
      <View className="gap-0.5">
        <Text className="font-dm-regular text-xs text-muted-foreground">
          {label}
        </Text>
        <Text
          className="font-dm-extrabold text-2xl leading-tight tracking-tight text-foreground"
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
   Recent Card
   ══════════════════════════════════════════════════════ */
const RecentCard = React.memo(function RecentCard() {
  const isEmpty = RECENT.length === 0;

  return (
    <View className="overflow-hidden rounded-2xl border border-border/40 bg-white">
      <View className="flex-row items-center justify-between border-b border-border/40 px-4 py-3">
        <Text className="font-dm-bold text-sm text-foreground">
          Transaksi terakhir
        </Text>
        <Text className="font-dm-regular text-xs text-muted-foreground">
          Hari ini
        </Text>
      </View>

      {isEmpty ? (
        <View className="items-center gap-1 px-4 py-10">
          <Text className="text-3xl">🧾</Text>
          <Text className="font-dm-semibold text-sm text-foreground">
            Belum ada transaksi
          </Text>
          <Text className="text-center font-dm-regular text-xs text-muted-foreground">
            Transaksi yang selesai akan muncul di sini
          </Text>
        </View>
      ) : (
        RECENT.map((t, i) => (
          <View
            key={t.id}
            className={`flex-row items-center gap-3 px-4 py-3 ${
              i < RECENT.length - 1 ? 'border-b border-border/30' : ''
            }`}
          >
            <View className="size-10 items-center justify-center rounded-full bg-accent/60">
              <Icon as={Receipt} size={16} className="text-primary" />
            </View>

            <View className="flex-1">
              <Text className="font-dm-semibold text-[13px] text-foreground">
                #{t.id}
              </Text>
              <Text className="font-dm-regular text-xs text-muted-foreground">
                {t.time} WIB, {t.items} item
              </Text>
            </View>

            <Text className="font-dm-bold text-[13px] text-foreground">
              {formatRupiah(t.total)}
            </Text>
            <Icon
              as={ChevronRight}
              size={15}
              className="text-muted-foreground/60"
            />
          </View>
        ))
      )}
    </View>
  );
});