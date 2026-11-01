import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, RefreshControl, AppState, ActivityIndicator, Pressable, type AppStateStatus } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Banknote,
  Receipt,
  Package,
  AlertTriangle,
  Trash2,
  LogOut,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

import { Text } from '@/components/ui/text';
import { useSession } from '@/lib/stores/session';
import { useProducts } from '@/lib/hooks/use-products';
import { useResponsive } from '@/lib/hooks/use-responsive';
import {
  fetchSales,
  fetchSaleDetail,
  fetchProductSummary,
  deleteSale,
  type ServerTime,
} from '@/lib/api/sales';
import { formatRupiah } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/app';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';

import { Screen } from '@/components/layout/screen';
import { LoadingScreen } from '@/components/feedback/loading-screen';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { BaseModal } from '@/components/ui/base-modal';
import { DashboardHeader } from '@/components/features/dashboard/dashboard-header';
import { StartCard } from '@/components/features/dashboard/start-card';
import { StatCard } from '@/components/features/dashboard/stat-card';
import { ProductSalesCard } from '@/components/features/dashboard/product-sales';
import { RecentCard } from '@/components/features/dashboard/recent-card';
import { ProductListCard } from '@/components/features/dashboard/product-list-card';
import { ReceiptModal } from '@/components/features/sales/receipt-modal';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { isWide } = useResponsive();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const queryClient = useQueryClient();
  const { user, signOut } = useSession();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [now, setNow] = useState(new Date());

  const storeId = user?.store_id;
  const cashierName = user?.name ?? 'Kasir';
  const storeName = user?.store?.name ?? 'Toko';
  const initial = cashierName.charAt(0).toUpperCase() || 'K';

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') queryClient.invalidateQueries({ queryKey: ['sales'] });
    });
    return () => sub.remove();
  }, [queryClient]);

  const { data: products = [] } = useProducts(storeId);

  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active).length,
    [products],
  );
  const promoProducts = useMemo(
    () =>
      products.filter(
        (p) => p.is_active && p.discount_price != null && p.minimal_discount != null,
      ).length,
    [products],
  );

  const { data: salesToday, isLoading: isLoadingSales } = useQuery({
    queryKey: ['sales', 'today', storeId],
    queryFn: fetchSales,
    enabled: !!storeId,
    staleTime: 0,
    refetchInterval: 60000,
  });

  const { data: productSummary = [] } = useQuery({
    queryKey: ['sales', 'product-summary', storeId],
    queryFn: () => fetchProductSummary(),
    enabled: !!storeId,
    staleTime: 0,
    refetchInterval: 60000,
  });

  const serverTime = salesToday?.meta?.server_time as ServerTime | undefined;
  const timeLabel =
    serverTime?.time ??
    now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  const dateFullLabel =
    serverTime?.date_full ??
    now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

  const todayStats = useMemo(() => {
    if (salesToday?.metrics) {
      return {
        salesTotal: salesToday.metrics.my_revenue,
        transactions: salesToday.metrics.my_transactions,
        itemsSold: salesToday.metrics.my_items_sold,
      };
    }
    const list = (salesToday?.data ?? []).filter((s) => s.status === 'completed');
    return {
      salesTotal: list.reduce((a, s) => a + s.total, 0),
      transactions: list.length,
      itemsSold: list.reduce((a, s) => a + (s.total_quantity ?? 0), 0),
    };
  }, [salesToday]);

  const recent = useMemo(
    () => (salesToday?.data ?? []).filter((s) => s.status === 'completed'),
    [salesToday],
  );

  const {
    data: saleDetail,
    isLoading: isLoadingDetail,
    isError: isDetailError,
    error: detailError,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['sale', 'detail', selectedSaleId],
    queryFn: () => fetchSaleDetail(selectedSaleId!),
    enabled: !!selectedSaleId,
    staleTime: 0,
    retry: 1,
  });

  const canModifySale = useMemo(() => {
    if (!saleDetail) return false;
    const today = new Date().toDateString();
    return (
      new Date(saleDetail.sale_date).toDateString() === today &&
      saleDetail.status === 'completed'
    );
  }, [saleDetail]);

  const closeDetail = useCallback(() => setSelectedSaleId(null), []);

  const handleEdit = useCallback(() => {
    if (!selectedSaleId) return;
    closeDetail();
    router.push(ROUTES.cashierEdit(selectedSaleId));
  }, [selectedSaleId, closeDetail]);

  const confirmDelete = useCallback(async () => {
    if (!selectedSaleId || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteSale(selectedSaleId);
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      setDeleteConfirmOpen(false);
      closeDetail();
    } finally {
      setIsDeleting(false);
    }
  }, [selectedSaleId, isDeleting, queryClient, closeDetail]);

  const refreshAll = useCallback(async () => {
    if (!storeId) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['sales'] });
      await queryClient.refetchQueries({ queryKey: ['products', storeId] });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, storeId]);

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

  if (isLoadingSales && !!storeId) {
    return <LoadingScreen message="Memuat data dashboard..." />;
  }

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_HEIGHT + 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshAll}
            tintColor={isDark ? '#A3C9A8' : '#84A98C'}
            colors={['#84A98C']}
          />
        }
      >
        <View className={isWide ? 'flex-row items-start gap-4' : 'gap-4'}>
          <View className={isWide ? 'flex-[3] gap-4' : 'gap-4'}>
            <StartCard
              onPress={() => router.push(ROUTES.cashier)}
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

          <View className={isWide ? 'flex-[2] gap-4' : 'gap-4'}>
            <RecentCard sales={recent} onSalePress={setSelectedSaleId} />
            <ProductListCard products={products} />
          </View>
        </View>
      </ScrollView>

      <DashboardHeader
        initial={initial}
        greeting={getGreeting()}
        name={cashierName}
        avatarUrl={user?.avatar_url ?? null}  // ⭐ NEW
        time={timeLabel}
        fullDate={dateFullLabel}
        expanded={isWide}
        isRefreshing={isRefreshing}
        onRefresh={refreshAll}
        onLogout={() => setLogoutConfirmOpen(true)}
      />

      {/* Detail — loading/error modal */}
      <BaseModal
        visible={!!selectedSaleId && (isLoadingDetail || isDetailError)}
        onClose={closeDetail}
      >
        {isLoadingDetail ? (
          <View className="w-full max-w-[320px] items-center gap-3 rounded-2xl bg-white p-6 dark:bg-stone-900">
            <ActivityIndicator size="large" />
            <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
              Memuat detail transaksi...
            </Text>
          </View>
        ) : (
          <View className="w-full max-w-[320px] items-center gap-3 rounded-2xl bg-white p-6 dark:bg-stone-900">
            <View className="size-12 items-center justify-center rounded-full bg-destructive/10 dark:bg-red-500/15">
              <AlertTriangle size={22} className="text-destructive dark:text-red-400" />
            </View>
            <Text className="text-center font-dm-bold text-sm text-foreground dark:text-stone-50">
              Gagal memuat transaksi
            </Text>
            <Text className="text-center font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
              {detailError instanceof Error
                ? detailError.message
                : 'Silakan coba lagi.'}
            </Text>
            <View className="mt-1 flex-row gap-2">
              <Pressable
                onPress={closeDetail}
                className="h-10 flex-1 items-center justify-center rounded-full border border-border/60 bg-white active:opacity-80 dark:border-stone-700/60 dark:bg-stone-900"
              >
                <Text className="font-dm-bold text-xs text-foreground dark:text-stone-50">
                  Tutup
                </Text>
              </Pressable>
              <Pressable
                onPress={() => refetchDetail()}
                className="h-10 flex-1 items-center justify-center rounded-full bg-primary active:opacity-90 dark:bg-sage-500"
              >
                <Text className="font-dm-bold text-xs text-primary-foreground">
                  Coba Lagi
                </Text>
              </Pressable>
            </View>
          </View>
        )}
      </BaseModal>

      <ReceiptModal
        sale={saleDetail ?? null}
        visible={
          !!selectedSaleId && !!saleDetail && !isLoadingDetail && !isDetailError
        }
        onClose={closeDetail}
        onEdit={handleEdit}
        onDelete={() => setDeleteConfirmOpen(true)}
        canModify={canModifySale}
      />

      <ConfirmModal
        visible={deleteConfirmOpen}
        icon={Trash2}
        title="Hapus transaksi ini?"
        description={`Transaksi ${saleDetail?.invoice_number} akan dibatalkan. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loadingLabel="Menghapus..."
        variant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      <ConfirmModal
        visible={logoutConfirmOpen}
        icon={LogOut}
        title="Keluar dari aplikasi?"
        description="Anda harus login kembali untuk melanjutkan transaksi."
        confirmLabel="Keluar"
        loadingLabel="Keluar..."
        variant="danger"
        isLoading={isLoggingOut}
        onConfirm={confirmLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </Screen>
  );
}