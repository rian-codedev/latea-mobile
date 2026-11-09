import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Search, X } from 'lucide-react-native';
import {
  activateKeepAwakeAsync,
  deactivateKeepAwake,
} from 'expo-keep-awake';

import { Icon } from '@/components/ui/icon';
import { useResponsive, getGridColumns } from '@/lib/hooks/use-responsive';
import { useProducts } from '@/lib/hooks/use-products';
import {
  fetchSaleDetail,
  createSale,
  type Sale,
} from '@/lib/api/sales';
import type { ApiProduct } from '@/lib/api/product';
import { getErrorMessage } from '@/lib/api/client';
import { useCart, calcTotals, type CartItem } from '@/lib/stores/cart';
import { useSession } from '@/lib/stores/session';
import { usePreferences } from '@/lib/stores/preferences';
import { ROUTES } from '@/lib/constants/app';

import { Screen } from '@/components/layout/screen';
import { LoadingOverlay } from '@/components/feedback/loading-overlay';
import { SuccessToast } from '@/components/feedback/success-toast';
import { EmptyState } from '@/components/feedback/empty-state';
import { CashierHeader } from '@/components/features/cashier/cashier-header';
import { ProductCard } from '@/components/features/cashier/product-card';
import { CartPanel } from '@/components/features/cashier/cart-panel';
import { CheckoutModal } from '@/components/features/cashier/checkout-modal';
import { FloatingCartBar } from '@/components/features/cashier/floating-cart-bar';
import {
  HEADER_HEIGHT,
  CART_BAR_HEIGHT,
  PRODUCT_CARD_HEIGHT,
} from '@/lib/theme/sizing';

type Spacer = { id: string; spacer: true };
type GridItem = ApiProduct | Spacer;

function isSpacer(item: GridItem): item is Spacer {
  return 'spacer' in item && item.spacer === true;
}

type ToastState = { msg: string; variant: 'success' | 'error' } | null;

export default function CashierScreen() {
  const insets = useSafeAreaInsets();
  const { device, isTablet } = useResponsive();
  const cols = getGridColumns(device, 'catalog');
  const queryClient = useQueryClient();

  /* ── Preferences ── */
  const checkoutModalEnabled = usePreferences((s) => s.checkoutModalEnabled);
  const keepAwakeEnabled = usePreferences((s) => s.keepAwakeEnabled);

  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editSale, setEditSale] = useState<Sale | null>(null);

  const { user } = useSession();
  const {
    data: apiProducts = [],
    isLoading,
    error,
    refetch,
  } = useProducts(user?.store_id);

  const params = useLocalSearchParams<{ editSaleId?: string }>();
  const editSaleId = params.editSaleId
    ? Number(params.editSaleId)
    : null;
  const isEditMode = !!editSaleId;

  /* ── Keep Awake toggle ── */
  useEffect(() => {
    if (!keepAwakeEnabled) return;
    activateKeepAwakeAsync('cashier').catch(() => {});
    return () => {
      deactivateKeepAwake('cashier').catch(() => {});
    };
  }, [keepAwakeEnabled]);

  const setCart = useCart((s) => s.setItems);
  const clearCart = useCart((s) => s.clear);
  const addItem = useCart((s) => s.addItem);
  const items = useCart((s) => s.items);
  const { total } = calcTotals(items);
  const itemCount = items.reduce((a, i) => a + i.quantity, 0);

  /* ── Edit mode: fetch sale ── */
  useEffect(() => {
    if (!editSaleId) {
      setEditSale(null);
      return;
    }
    let cancelled = false;
    setIsLoadingEdit(true);
    fetchSaleDetail(editSaleId)
      .then((sale) => !cancelled && setEditSale(sale))
      .catch(() => !cancelled && router.replace(ROUTES.home))
      .finally(() => !cancelled && setIsLoadingEdit(false));
    return () => {
      cancelled = true;
    };
  }, [editSaleId]);

  /* ── Edit mode: enrich cart ── */
  useEffect(() => {
    if (!editSale || apiProducts.length === 0) return;
    clearCart();
    const cartItems: CartItem[] = editSale.items.map((it) => {
      const productId = Number(it.product_id);
      const product = apiProducts.find(
        (p) => Number(p.id) === productId,
      );
      return {
        productId,
        name: it.product_name,
        code: it.product_code ?? product?.code ?? '',
        emoji: product?.emoji ?? '📦',
        imageUrl: product?.image_url ?? null,
        price: it.price,
        discountPrice:
          it.discount_price ?? product?.discount_price ?? null,
        minimalDiscount: product?.minimal_discount ?? null,
        quantity: it.quantity,
      };
    });
    setCart(cartItems);
  }, [editSale, apiProducts, setCart, clearCart]);

  const showToast = useCallback(
    (msg: string, variant: 'success' | 'error' = 'success') => {
      setToast({ msg, variant });
      setTimeout(
        () => setToast(null),
        variant === 'error' ? 5000 : 3000,
      );
    },
    [],
  );

  const qtyMap = useMemo(() => {
    const m = new Map<number, number>();
    items.forEach((i) => m.set(i.productId, i.quantity));
    return m;
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return apiProducts.filter((p) => {
      if (!p.is_active) return false;
      if (
        q &&
        !`${p.name} ${p.code}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [apiProducts, search]);

  const gridData = useMemo<GridItem[]>(() => {
    const rem = filtered.length % cols;
    if (rem === 0) return filtered;
    const spacers: Spacer[] = Array.from(
      { length: cols - rem },
      (_, i) => ({
        id: `spacer-${i}`,
        spacer: true as const,
      }),
    );
    return [...filtered, ...spacers];
  }, [filtered, cols]);

  const handleSubmitSuccess = useCallback(
    (sale: Sale) => {
      setCheckoutOpen(false);
      showToast(
        isEditMode
          ? `Transaksi ${sale.invoice_number} berhasil diperbarui`
          : `Transaksi ${sale.invoice_number} berhasil`,
        'success',
      );
      if (isEditMode)
        setTimeout(() => router.replace(ROUTES.home), 1200);
    },
    [isEditMode, showToast],
  );

  /* ── Quick pay: langsung submit tanpa modal ── */
  const quickPay = useCallback(async () => {
    if (items.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const sale = await createSale({
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
        payment_amount: total,
      });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      clearCart();
      setCartOpen(false);
      showToast(
        `Transaksi ${sale.invoice_number} berhasil`,
        'success',
      );
    } catch (e) {
      showToast(getErrorMessage(e), 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [
    items,
    total,
    isProcessing,
    queryClient,
    clearCart,
    showToast,
  ]);

  const handlePay = useCallback(() => {
    if (items.length === 0 || isProcessing) return;

    // Edit mode atau modal aktif → buka modal
    if (checkoutModalEnabled || isEditMode) {
      setCartOpen(false);
      setCheckoutOpen(true);
      return;
    }

    // Mode cepat → langsung submit
    void quickPay();
  }, [
    items.length,
    isProcessing,
    checkoutModalEnabled,
    isEditMode,
    quickPay,
  ]);

  const handleBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace(ROUTES.home);

  const isQuickPayMode = !checkoutModalEnabled && !isEditMode;

  return (
    <Screen>
      <View
        className="flex-1 flex-row"
        style={{ paddingTop: insets.top + HEADER_HEIGHT }}
      >
        {/* ═══ Katalog ═══ */}
        <View
          className={
            isTablet
              ? 'flex-[7] border-r border-border/40 dark:border-stone-800/60'
              : 'flex-1'
          }
        >
          {/* Search */}
          <View className="bg-white px-3 pb-2 pt-3 dark:bg-stone-950">
            <View className="h-11 flex-row items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-4 dark:border-stone-700/60 dark:bg-stone-800/40">
              <Icon
                as={Search}
                size={16}
                className="text-muted-foreground dark:text-stone-400"
              />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Cari nama atau kode produk"
                placeholderTextColor="#9CA3AF"
                className="flex-1 py-0 font-dm-regular text-sm text-foreground dark:text-stone-50"
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
                  <Icon
                    as={X}
                    size={16}
                    className="text-muted-foreground dark:text-stone-400"
                  />
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Grid */}
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
                return (
                  <View
                    className="flex-1"
                    style={{ height: PRODUCT_CARD_HEIGHT }}
                  />
                );
              }
              return (
                <ProductCard
                  product={item}
                  qty={qtyMap.get(item.id) ?? 0}
                  onPress={() =>
                    addItem({
                      productId: item.id,
                      name: item.name,
                      code: item.code,
                      emoji: item.emoji ?? '📦',
                      imageUrl: item.image_url,
                      price: item.price,
                      discountPrice: item.discount_price,
                      minimalDiscount: item.minimal_discount,
                    })
                  }
                />
              );
            }}
            ListEmptyComponent={
              isLoading ? (
                <EmptyState emoji="⏳" title="Memuat produk..." />
              ) : error ? (
                <EmptyState
                  emoji="⚠️"
                  title="Gagal memuat produk"
                  actionLabel="Coba Lagi"
                  onAction={() => refetch()}
                />
              ) : (
                <EmptyState
                  emoji="🔍"
                  title="Produk tidak ditemukan"
                  description="Coba kata kunci atau kode produk lain"
                />
              )
            }
          />
        </View>

        {/* ═══ Cart (tablet) ═══ */}
        {isTablet ? (
          <View className="flex-[3] bg-white dark:bg-stone-950">
            <CartPanel
              bottomInset={insets.bottom}
              onCheckout={handlePay}
              isProcessing={isProcessing}
              isQuickPay={isQuickPayMode}
            />
          </View>
        ) : null}
      </View>

      <CashierHeader
        isEditMode={isEditMode}
        isQuickPay={isQuickPayMode}
        onBack={handleBack}
      />

      {!isTablet ? (
        <FloatingCartBar
          itemCount={itemCount}
          total={total}
          onPress={() => setCartOpen(true)}
        />
      ) : null}

      {!isTablet ? (
        <Modal
          visible={cartOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setCartOpen(false)}
        >
          <View className="flex-1 justify-end bg-black/40">
            <View
              className="overflow-hidden rounded-t-3xl bg-white dark:bg-stone-950"
              style={{ height: '78%' }}
            >
              <CartPanel
                bottomInset={insets.bottom}
                onClose={() => setCartOpen(false)}
                onCheckout={handlePay}
                isProcessing={isProcessing}
                isQuickPay={isQuickPayMode}
              />
            </View>
          </View>
        </Modal>
      ) : null}

      <CheckoutModal
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        bottomInset={insets.bottom}
        onSuccess={handleSubmitSuccess}
        editSaleId={editSaleId}
        isEditMode={isEditMode}
      />

      <LoadingOverlay
        visible={isLoadingEdit}
        message="Memuat data transaksi..."
      />
      <SuccessToast
        message={toast?.msg ?? null}
        variant={toast?.variant}
      />
    </Screen>
  );
}