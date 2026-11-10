import { useState } from 'react';
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
} from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/layout/screen';
import { GlassHeader } from '@/components/layout/glass-header';
import { IconButton } from '@/components/ui/icon-button';
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
import { ROUTES } from '@/lib/constants/app';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';

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

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();

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

  const [keepAwakeConfirmOpen, setKeepAwakeConfirmOpen] = useState(false);
  const [quickPayConfirmOpen, setQuickPayConfirmOpen] = useState(false);

  const initial = (user?.name ?? 'K').charAt(0).toUpperCase();
  const storeInitial = (user?.store?.name ?? 'T').charAt(0).toUpperCase();
  const storeAvatarUrl = user?.store?.avatar_url;

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
    </Screen>
  );
}