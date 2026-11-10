import { useMemo, useState } from 'react';
import { ScrollView, View, Image, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Sun,
  Moon,
  Smartphone,
  Monitor,
  Zap,
  Info,
  Check,
  Store as StoreIcon,
  AlertTriangle,
  Palette,
  Wallet,
  Shield,
  Clock,
  ChevronRight,
  Mic,
  Timer,
  Volume2,
  Lightbulb,
} from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/layout/screen';
import { GlassHeader } from '@/components/layout/glass-header';
import { IconButton } from '@/components/ui/icon-button';
import { BaseModal } from '@/components/ui/base-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import {
  SettingsSection,
  SettingsDivider,
} from '@/components/features/settings/settings-section';
import { SettingsRow } from '@/components/features/settings/settings-row';
import { SettingsSwitch } from '@/components/features/settings/settings-switch';
import { useSession } from '@/lib/stores/session';
import {
  usePreferences,
  type ThemePreference,
} from '@/lib/stores/preferences';
import { useProducts } from '@/lib/hooks/use-products';
import { ROUTES } from '@/lib/constants/app';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';

import { VoiceFab, type VoiceFabState } from '@/components/features/cashier/voice-fab';
import { VoiceListeningIndicator } from '@/components/features/cashier/voice-listening-indicator';
import { VoiceConfirmModal } from '@/components/features/cashier/voice-confirm-modal';
import { VoicePickerModal } from '@/components/features/cashier/voice-picker-modal';
import { VoiceUndoToast, type VoiceUndoToastState } from '@/components/features/cashier/voice-undo-toast';
import type { ApiProduct } from '@/lib/api/product';

const THEMES: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
    { value: 'system', label: 'Ikuti Sistem', icon: Smartphone },
    { value: 'light', label: 'Terang', icon: Sun },
    { value: 'dark', label: 'Gelap', icon: Moon },
  ];

const SESSION_TIMEOUT_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: '30 menit' },
  { value: 60, label: '1 jam' },
  { value: 120, label: '2 jam' },
  { value: 0, label: 'Nonaktif' },
];

const VOICE_IDLE_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: '30 detik' },
  { value: 60, label: '1 menit' },
  { value: 120, label: '2 menit' },
  { value: 300, label: '5 menit' },
  { value: 0, label: 'Nonaktif' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();

  /* ═══ VOICE PREVIEW STATE (Dev Only) ═══ */
  const [previewFabState, setPreviewFabState] =
    useState<VoiceFabState>('idle');
  const [previewFabVisible, setPreviewFabVisible] = useState(false);
  const [previewConfirmOpen, setPreviewConfirmOpen] = useState(false);
  const [previewPickerOpen, setPreviewPickerOpen] = useState(false);
  const [previewUndo, setPreviewUndo] = useState<VoiceUndoToastState>(null);

  const [previewConfirmVoiceAnswer, setPreviewConfirmVoiceAnswer] =
    useState<'yes' | 'no' | null>(null);
  const [previewConfirmHeard, setPreviewConfirmHeard] =
    useState<string | null>(null);
  const [previewPickerVoiceIndex, setPreviewPickerVoiceIndex] =
    useState<number | null>(null);
  const [previewPickerHeard, setPreviewPickerHeard] =
    useState<string | null>(null);

  const PREVIEW_MOCK_PRODUCT: ApiProduct = {
    id: 4,
    code: 'TO-MINI',
    name: 'Teh Ori Mini',
    emoji: null,
    image_url: null,
    price: 3000,
    discount_price: null,
    minimal_discount: null,
    is_active: true,
    is_available: true,
  };

  const PREVIEW_PICKER_CANDIDATES = [
    { product: PREVIEW_MOCK_PRODUCT, score: 0.72 },
    {
      product: { ...PREVIEW_MOCK_PRODUCT, id: 5, code: 'TO-JUMBO', name: 'Teh Ori Jumbo', price: 5000 },
      score: 0.71,
    },
    {
      product: { ...PREVIEW_MOCK_PRODUCT, id: 6, code: 'TS-MINI', name: 'Teh Susu Mini', price: 4000 },
      score: 0.48,
    },
  ];

  /* ── Preferences ── */
  const theme = usePreferences((s) => s.theme);
  const setTheme = usePreferences((s) => s.setTheme);
  const keepAwakeEnabled = usePreferences((s) => s.keepAwakeEnabled);
  const setKeepAwakeEnabled = usePreferences((s) => s.setKeepAwakeEnabled);
  const checkoutModalEnabled = usePreferences(
    (s) => s.checkoutModalEnabled,
  );
  const setCheckoutModalEnabled = usePreferences(
    (s) => s.setCheckoutModalEnabled,
  );
  const sessionIdleMinutes = usePreferences((s) => s.sessionIdleMinutes);
  const setSessionIdleMinutes = usePreferences(
    (s) => s.setSessionIdleMinutes,
  );
  const voiceEnabled = usePreferences((s) => s.voiceEnabled);
  const setVoiceEnabled = usePreferences((s) => s.setVoiceEnabled);
  const voiceIdleSeconds = usePreferences((s) => s.voiceIdleSeconds);
  const setVoiceIdleSeconds = usePreferences((s) => s.setVoiceIdleSeconds);
  const ttsEnabled = usePreferences((s) => s.ttsEnabled);
  const setTtsEnabled = usePreferences((s) => s.setTtsEnabled);

  /* ── Products (for voice guard) ── */
  const { data: products = [] } = useProducts(user?.store_id);
  const activeProductCount = useMemo(
    () => products.filter((p) => p.is_active).length,
    [products],
  );

  const voiceGuard = useMemo(() => {
    if (!user?.store_id) {
      return {
        allowed: false,
        message:
          'Belum ada toko. Voice Command memerlukan produk.',
      };
    }
    if (activeProductCount > 50) {
      return {
        allowed: false,
        message:
          'Voice Command dinonaktifkan karena katalog melebihi 50 produk.',
      };
    }
    if (activeProductCount > 30) {
      return {
        allowed: true,
        warning: 'Katalog cukup besar. Akurasi suara mungkin menurun.',
      };
    }
    return { allowed: true };
  }, [user?.store_id, activeProductCount]);

  /* ── Local state ── */
  const [keepAwakeConfirmOpen, setKeepAwakeConfirmOpen] = useState(false);
  const [quickPayConfirmOpen, setQuickPayConfirmOpen] = useState(false);
  const [voiceIdlePickerOpen, setVoiceIdlePickerOpen] = useState(false);

  const initial = (user?.name ?? 'K').charAt(0).toUpperCase();
  const storeInitial = (user?.store?.name ?? 'T').charAt(0).toUpperCase();
  const storeAvatarUrl = user?.store?.avatar_url;

  const voiceIdleLabel = useMemo(() => {
    if (voiceIdleSeconds === 0) return 'Nonaktif';
    if (voiceIdleSeconds < 60) return `${voiceIdleSeconds} detik`;
    return `${voiceIdleSeconds / 60} menit`;
  }, [voiceIdleSeconds]);

  /* ── Handlers ── */
  const handleKeepAwakeToggle = (value: boolean) => {
    if (value) {
      setKeepAwakeConfirmOpen(true);
    } else {
      setKeepAwakeEnabled(false);
    }
  };

  const confirmKeepAwake = () => {
    setKeepAwakeEnabled(true);
    setKeepAwakeConfirmOpen(false);
  };

  const handleQuickPayToggle = (value: boolean) => {
    if (value) {
      setQuickPayConfirmOpen(true);
    } else {
      setCheckoutModalEnabled(true);
    }
  };

  const confirmQuickPay = () => {
    setCheckoutModalEnabled(false);
    setQuickPayConfirmOpen(false);
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + HEADER_HEIGHT + 16,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 16,
          gap: 20,
        }}
      >
        {/* ═══ Card Profil ═══ */}
        <Pressable
          onPress={() => router.push(ROUTES.settingsAccount)}
          accessibilityRole="button"
          accessibilityLabel="Buka pengaturan akun"
          className="overflow-hidden rounded-2xl border border-border/40 bg-white active:bg-muted/40 dark:border-stone-800/60 dark:bg-stone-900 dark:active:bg-stone-800/40"
        >
          <View className="flex-row items-center gap-3 p-4">
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={{ width: 56, height: 56, borderRadius: 28 }}
                resizeMode="cover"
              />
            ) : (
              <View className="size-14 items-center justify-center rounded-full bg-primary dark:bg-sage-500">
                <Text className="font-dm-extrabold text-lg text-primary-foreground">
                  {initial}
                </Text>
              </View>
            )}
            <View className="flex-1">
              <Text
                className="font-dm-bold text-base text-foreground dark:text-stone-50"
                numberOfLines={1}
              >
                {user?.name ?? 'Kasir'}
              </Text>
              <Text
                className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400"
                numberOfLines={1}
              >
                {user?.email ?? '-'}
              </Text>
            </View>
            <Icon
              as={ChevronRight}
              size={18}
              className="text-muted-foreground/60 dark:text-stone-500/60"
            />
          </View>

          <View className="flex-row items-center gap-2.5 border-t border-border/40 px-4 py-2.5 dark:border-stone-800/60">
            {user?.store ? (
              <>
                {storeAvatarUrl ? (
                  <Image
                    source={{ uri: storeAvatarUrl }}
                    style={{ width: 24, height: 24, borderRadius: 12 }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="size-6 items-center justify-center rounded-full bg-accent/60 dark:bg-stone-800">
                    <Text className="font-dm-bold text-[10px] text-primary dark:text-sage-400">
                      {storeInitial}
                    </Text>
                  </View>
                )}
                <Icon
                  as={StoreIcon}
                  size={12}
                  className="text-muted-foreground dark:text-stone-400"
                />
                <Text
                  className="flex-1 font-dm-medium text-xs text-muted-foreground dark:text-stone-400"
                  numberOfLines={1}
                >
                  {user.store.name}
                </Text>
              </>
            ) : (
              <>
                <Icon
                  as={AlertTriangle}
                  size={14}
                  className="text-amber-600 dark:text-amber-400"
                />
                <Text className="flex-1 font-dm-medium text-xs text-amber-600 dark:text-amber-400">
                  Belum ada toko
                </Text>
              </>
            )}
          </View>
        </Pressable>

        {/* ═══ Tampilan & Tema ═══ */}
        <SettingsSection title="Tampilan & Tema" icon={Palette}>
          {THEMES.map((opt, i) => {
            const selected = theme === opt.value;
            return (
              <View key={opt.value}>
                <SettingsRow
                  icon={opt.icon}
                  label={opt.label}
                  onPress={() => setTheme(opt.value)}
                  right={
                    selected ? (
                      <Icon
                        as={Check}
                        size={18}
                        className="text-primary dark:text-sage-400"
                      />
                    ) : undefined
                  }
                />
                {i < THEMES.length - 1 ? <SettingsDivider /> : null}
              </View>
            );
          })}
          <SettingsDivider />
          <SettingsRow
            icon={Monitor}
            label="Layar Tetap Menyala"
            description="Menguras baterai lebih cepat"
            right={
              <SettingsSwitch
                value={keepAwakeEnabled}
                onValueChange={handleKeepAwakeToggle}
              />
            }
          />
        </SettingsSection>

        {/* ═══ Kasir ═══ */}
        <SettingsSection title="Kasir" icon={Wallet}>
          <SettingsRow
            icon={Zap}
            label="Mode Kasir Cepat"
            description="Lewati modal pembayaran — uang otomatis dianggap pas"
            right={
              <SettingsSwitch
                value={!checkoutModalEnabled}
                onValueChange={handleQuickPayToggle}
              />
            }
          />
        </SettingsSection>

        {/* ═══ Suara ═══ */}
        <SettingsSection title="Suara" icon={Mic}>
          {/* Guard warning (tidak allowed) */}
          {!voiceGuard.allowed ? (
            <View className="flex-row items-start gap-2 border-b border-border/40 bg-amber-50 px-4 py-3 dark:border-stone-800/60 dark:bg-amber-950/40">
              <Icon
                as={AlertTriangle}
                size={14}
                className="mt-0.5 text-amber-700 dark:text-amber-400"
              />
              <Text className="flex-1 font-dm-regular text-[11px] leading-4 text-amber-800 dark:text-amber-300">
                {voiceGuard.message}
              </Text>
            </View>
          ) : null}

          {/* Warning (allowed but degraded) */}
          {voiceGuard.allowed && voiceGuard.warning ? (
            <View className="flex-row items-start gap-2 border-b border-border/40 bg-amber-50 px-4 py-3 dark:border-stone-800/60 dark:bg-amber-950/40">
              <Icon
                as={AlertTriangle}
                size={14}
                className="mt-0.5 text-amber-700 dark:text-amber-400"
              />
              <Text className="flex-1 font-dm-regular text-[11px] leading-4 text-amber-800 dark:text-amber-300">
                {voiceGuard.warning}
              </Text>
            </View>
          ) : null}

          <SettingsRow
            icon={Mic}
            label="Voice Command"
            description="Tambah produk lewat suara"
            right={
              <SettingsSwitch
                value={voiceEnabled && voiceGuard.allowed}
                onValueChange={setVoiceEnabled}
                disabled={!voiceGuard.allowed}
              />
            }
          />

          {/* Progressive disclosure: sub-settings hanya jika voice ON */}
          {voiceEnabled && voiceGuard.allowed ? (
            <>
              <SettingsDivider />
              <SettingsRow
                icon={Timer}
                label="Auto-Pause Mikrofon"
                description="Pause otomatis jika tidak ada suara"
                onPress={() => setVoiceIdlePickerOpen(true)}
                right={
                  <View className="flex-row items-center gap-1.5">
                    <Text className="font-dm-medium text-xs text-muted-foreground dark:text-stone-400">
                      {voiceIdleLabel}
                    </Text>
                    <Icon
                      as={ChevronRight}
                      size={14}
                      className="text-muted-foreground/60 dark:text-stone-500/60"
                    />
                  </View>
                }
              />
              <SettingsDivider />
              <SettingsRow
                icon={Volume2}
                label="Suara Feedback"
                description="Bacakan hasil perintah"
                right={
                  <SettingsSwitch
                    value={ttsEnabled}
                    onValueChange={setTtsEnabled}
                  />
                }
              />
              <SettingsDivider />
              <View className="bg-muted/20 px-4 py-3 dark:bg-stone-800/20">
                <View className="flex-row items-start gap-2">
                  <Icon
                    as={Lightbulb}
                    size={12}
                    className="mt-0.5 text-primary dark:text-sage-400"
                  />
                  <View className="flex-1">
                    <Text className="font-dm-semibold text-[11px] text-foreground dark:text-stone-50">
                      Contoh perintah
                    </Text>
                    <Text className="mt-0.5 font-dm-regular text-[11px] leading-4 text-muted-foreground dark:text-stone-400">
                      "Hai Latea, tambah teh ori mini 2"
                      {'\n'}atau langsung: "teh ori mini 2"
                    </Text>
                  </View>
                </View>
              </View>
            </>
          ) : null}
        </SettingsSection>

        {/* ═══ Keamanan ═══ */}
        <SettingsSection title="Keamanan" icon={Shield}>
          {SESSION_TIMEOUT_OPTIONS.map((opt, i) => {
            const selected = sessionIdleMinutes === opt.value;
            return (
              <View key={opt.value}>
                <SettingsRow
                  icon={Clock}
                  label={opt.label}
                  description={
                    opt.value === 0
                      ? 'Aplikasi tidak akan logout otomatis'
                      : undefined
                  }
                  onPress={() => setSessionIdleMinutes(opt.value)}
                  right={
                    selected ? (
                      <Icon
                        as={Check}
                        size={18}
                        className="text-primary dark:text-sage-400"
                      />
                    ) : undefined
                  }
                />
                {i < SESSION_TIMEOUT_OPTIONS.length - 1 ? (
                  <SettingsDivider />
                ) : null}
              </View>
            );
          })}
        </SettingsSection>

        {/* ═══ Tentang ═══ */}
        <SettingsSection title="Tentang" icon={Info}>
          <SettingsRow
            icon={Info}
            label="Tentang Aplikasi"
            onPress={() => router.push(ROUTES.settingsAbout)}
          />
        </SettingsSection>

        {/* ═══ VOICE UI PREVIEW (Dev Only) ═══ */}
        {__DEV__ ? (
          <SettingsSection title="🔧 Dev: Voice UI Preview" icon={Mic}>
            <View className="gap-2 p-4">
              <Text className="mb-2 font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
                Tap tombol untuk test tampilan voice components.
              </Text>

              {/* FAB Preview */}
              <View className="flex-row flex-wrap gap-2">
                {(['idle', 'listening', 'processing', 'paused'] as const).map(
                  (s) => (
                    <Pressable
                      key={s}
                      onPress={() => {
                        setPreviewFabState(s);
                        setPreviewFabVisible(true);
                      }}
                      className={`rounded-full border px-3 py-1.5 ${previewFabState === s
                        ? 'border-primary bg-primary/10 dark:border-sage-500 dark:bg-sage-500/10'
                        : 'border-border/60 bg-white dark:border-stone-700 dark:bg-stone-900'
                        }`}
                    >
                      <Text
                        className={`font-dm-semibold text-[11px] ${previewFabState === s
                          ? 'text-primary dark:text-sage-400'
                          : 'text-foreground dark:text-stone-50'
                          }`}
                      >
                        FAB: {s}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>

              {/* Hide FAB + indicator */}
              {previewFabVisible ? (
                <Pressable
                  onPress={() => setPreviewFabVisible(false)}
                  className="rounded-full border border-destructive/60 bg-white px-3 py-1.5 active:opacity-70 dark:bg-stone-900"
                >
                  <Text className="font-dm-semibold text-[11px] text-destructive dark:text-red-400">
                    Sembunyikan FAB
                  </Text>
                </Pressable>
              ) : null}

              {/* Modals & Toast */}
              <View className="flex-row flex-wrap gap-2 pt-2">
                <Pressable
                  onPress={() => {
                    setPreviewConfirmVoiceAnswer(null);
                    setPreviewConfirmHeard(null);
                    setPreviewConfirmOpen(true);
                  }}
                  className="rounded-full border border-border/60 bg-white px-3 py-1.5 active:opacity-70 dark:border-stone-700 dark:bg-stone-900"
                >
                  <Text className="font-dm-semibold text-[11px] text-foreground dark:text-stone-50">
                    Confirm Modal
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setPreviewPickerVoiceIndex(null);
                    setPreviewPickerHeard(null);
                    setPreviewPickerOpen(true);
                  }}
                  className="rounded-full border border-border/60 bg-white px-3 py-1.5 active:opacity-70 dark:border-stone-700 dark:bg-stone-900"
                >
                  <Text className="font-dm-semibold text-[11px] text-foreground dark:text-stone-50">
                    Picker Modal
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    setPreviewUndo({
                      message: 'Teh Ori Mini × 2 ditambahkan',
                      onUndo: () => {
                        // dev preview — no real undo
                      },
                    })
                  }
                  className="rounded-full border border-border/60 bg-white px-3 py-1.5 active:opacity-70 dark:border-stone-700 dark:bg-stone-900"
                >
                  <Text className="font-dm-semibold text-[11px] text-foreground dark:text-stone-50">
                    Undo Toast
                  </Text>
                </Pressable>
              </View>

              {/* ⭐ Test voice answer — khusus dev preview */}
              <View className="mt-2 gap-1">
                <Text className="font-dm-semibold text-[10px] uppercase tracking-wider text-muted-foreground dark:text-stone-400">
                  Test Voice Answer
                </Text>
                <View className="flex-row flex-wrap gap-1.5">
                  <Pressable
                    onPress={() => {
                      setPreviewConfirmVoiceAnswer('yes');
                      setPreviewConfirmHeard('ya');
                    }}
                    disabled={!previewConfirmOpen}
                    className={`rounded-full px-2.5 py-1 ${previewConfirmOpen
                        ? 'bg-emerald-100 active:opacity-70 dark:bg-emerald-950/60'
                        : 'bg-muted/40 dark:bg-stone-800/40'
                      }`}
                  >
                    <Text className="font-dm-semibold text-[10px] text-emerald-700 dark:text-emerald-400">
                      ✓ "ya"
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setPreviewConfirmVoiceAnswer('no');
                      setPreviewConfirmHeard('tidak');
                    }}
                    disabled={!previewConfirmOpen}
                    className={`rounded-full px-2.5 py-1 ${previewConfirmOpen
                        ? 'bg-destructive/10 active:opacity-70 dark:bg-red-500/15'
                        : 'bg-muted/40 dark:bg-stone-800/40'
                      }`}
                  >
                    <Text className="font-dm-semibold text-[10px] text-destructive dark:text-red-400">
                      ✗ "tidak"
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setPreviewPickerVoiceIndex(1);
                      setPreviewPickerHeard('satu');
                    }}
                    disabled={!previewPickerOpen}
                    className={`rounded-full px-2.5 py-1 ${previewPickerOpen
                        ? 'bg-primary/10 active:opacity-70 dark:bg-sage-500/15'
                        : 'bg-muted/40 dark:bg-stone-800/40'
                      }`}
                  >
                    <Text className="font-dm-semibold text-[10px] text-primary dark:text-sage-400">
                      1: "satu"
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setPreviewPickerVoiceIndex(2);
                      setPreviewPickerHeard('dua');
                    }}
                    disabled={!previewPickerOpen}
                    className={`rounded-full px-2.5 py-1 ${previewPickerOpen
                        ? 'bg-primary/10 active:opacity-70 dark:bg-sage-500/15'
                        : 'bg-muted/40 dark:bg-stone-800/40'
                      }`}
                  >
                    <Text className="font-dm-semibold text-[10px] text-primary dark:text-sage-400">
                      2: "dua"
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setPreviewPickerVoiceIndex(3);
                      setPreviewPickerHeard('tiga');
                    }}
                    disabled={!previewPickerOpen}
                    className={`rounded-full px-2.5 py-1 ${previewPickerOpen
                        ? 'bg-primary/10 active:opacity-70 dark:bg-sage-500/15'
                        : 'bg-muted/40 dark:bg-stone-800/40'
                      }`}
                  >
                    <Text className="font-dm-semibold text-[10px] text-primary dark:text-sage-400">
                      3: "tiga"
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </SettingsSection>
        ) : null}

        {/* ═══ VOICE FAB OVERLAY (Dev Only) ═══ */}
        {__DEV__ && previewFabVisible ? (
          <>
            <VoiceFab
              state={previewFabState}
              onPress={() => {
                // dev preview — cycle state
                const next: VoiceFabState[] = ['idle', 'listening', 'processing', 'paused'];
                const idx = next.indexOf(previewFabState);
                setPreviewFabState(next[(idx + 1) % next.length]);
              }}
              bottomOffset={insets.bottom + 100}
            />
            <VoiceListeningIndicator
              visible={previewFabState === 'listening'}
              bottomOffset={insets.bottom + 100}
            />
          </>
        ) : null}
      </ScrollView>

      <GlassHeader>
        <IconButton
          icon={ArrowLeft}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace(ROUTES.home)
          }
          accessibilityLabel="Kembali"
        />
        <View className="flex-1">
          <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
            Pengaturan
          </Text>
          <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            Preferensi aplikasi & akun
          </Text>
        </View>
      </GlassHeader>

      {/* Voice idle timeout picker */}
      <BaseModal
        visible={voiceIdlePickerOpen}
        onClose={() => setVoiceIdlePickerOpen(false)}
        align="center"
        maxWidth={320}
      >
        <View className="w-full overflow-hidden rounded-2xl bg-white dark:bg-stone-900">
          <View className="border-b border-border/40 px-4 py-3 dark:border-stone-800/60">
            <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
              Auto-Pause Mikrofon
            </Text>
            <Text className="mt-0.5 font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
              Pause otomatis jika tidak ada suara
            </Text>
          </View>
          {VOICE_IDLE_OPTIONS.map((opt, i) => {
            const selected = voiceIdleSeconds === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setVoiceIdleSeconds(opt.value);
                  setVoiceIdlePickerOpen(false);
                }}
                accessibilityRole="button"
                className={`flex-row items-center justify-between px-4 py-3 active:bg-muted/40 dark:active:bg-stone-800/40 ${i < VOICE_IDLE_OPTIONS.length - 1
                  ? 'border-b border-border/40 dark:border-stone-800/60'
                  : ''
                  }`}
              >
                <Text
                  className={`font-dm-medium text-sm ${selected
                    ? 'text-primary dark:text-sage-400'
                    : 'text-foreground dark:text-stone-50'
                    }`}
                >
                  {opt.label}
                </Text>
                {selected ? (
                  <Icon
                    as={Check}
                    size={18}
                    className="text-primary dark:text-sage-400"
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BaseModal>

      {/* Confirm Keep Awake */}
      <ConfirmModal
        visible={keepAwakeConfirmOpen}
        icon={Monitor}
        title="Aktifkan Layar Tetap Menyala?"
        description="Layar tidak akan mati saat berada di halaman Kasir. Ini menguras baterai lebih cepat."
        confirmLabel="Aktifkan"
        cancelLabel="Batal"
        variant="primary"
        onConfirm={confirmKeepAwake}
        onCancel={() => setKeepAwakeConfirmOpen(false)}
      />

      {/* Confirm Quick Pay */}
      <ConfirmModal
        visible={quickPayConfirmOpen}
        icon={Zap}
        title="Aktifkan Mode Kasir Cepat?"
        description="Mode ini akan melewati modal pembayaran. Uang otomatis dianggap pas."
        confirmLabel="Aktifkan"
        cancelLabel="Batal"
        variant="primary"
        onConfirm={confirmQuickPay}
        onCancel={() => setQuickPayConfirmOpen(false)}
      />

      {/* ═══ VOICE PREVIEW MODALS (Dev Only) ═══ */}
      {__DEV__ ? (
        <>
          <VoiceConfirmModal
            visible={previewConfirmOpen}
            product={PREVIEW_MOCK_PRODUCT}
            quantity={2}
            originalText="teh ori mini 2"
            onCancel={() => {
              setPreviewConfirmOpen(false);
              setPreviewConfirmVoiceAnswer(null);
              setPreviewConfirmHeard(null);
            }}
            onConfirm={() => {
              setPreviewConfirmOpen(false);
              setPreviewConfirmVoiceAnswer(null);
              setPreviewConfirmHeard(null);
              setPreviewUndo({
                message: 'Teh Ori Mini × 2 ditambahkan',
                onUndo: () => { },
              });
            }}
            voiceAnswer={previewConfirmVoiceAnswer}
            heardText={previewConfirmHeard}
            listening={previewConfirmOpen && !previewConfirmVoiceAnswer}
          />
          <VoicePickerModal
            visible={previewPickerOpen}
            candidates={PREVIEW_PICKER_CANDIDATES}
            quantity={3}
            originalText="teh ori 3"
            onCancel={() => {
              setPreviewPickerOpen(false);
              setPreviewPickerVoiceIndex(null);
              setPreviewPickerHeard(null);
            }}
            onPick={(product) => {
              setPreviewPickerOpen(false);
              setPreviewPickerVoiceIndex(null);
              setPreviewPickerHeard(null);
              setPreviewUndo({
                message: `${product.name} × 3 ditambahkan`,
                onUndo: () => { },
              });
            }}
            voiceIndex={previewPickerVoiceIndex}
            heardText={previewPickerHeard}
            listening={previewPickerOpen && previewPickerVoiceIndex === null}
          />
          <VoiceUndoToast
            state={previewUndo}
            onHide={() => setPreviewUndo(null)}
          />
        </>
      ) : null}
    </Screen>
  );
}