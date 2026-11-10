import { useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Image,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
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
  AudioLines,
  Gauge,
  Play,
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
import {
  getIndonesianVoices,
  speak,
  speakPreview,
} from '@/lib/voice/tts';
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

const VOICE_IDLE_OPTIONS: { value: number; label: string }[] = [
  { value: 30, label: '30 detik' },
  { value: 60, label: '1 menit' },
  { value: 120, label: '2 menit' },
  { value: 300, label: '5 menit' },
  { value: 0, label: 'Nonaktif' },
];

const VOICE_NO_SPEECH_OPTIONS: { value: number; label: string }[] = [
  { value: 2, label: '2 detik' },
  { value: 3, label: '3 detik' },
  { value: 5, label: '5 detik' },
  { value: 8, label: '8 detik' },
];

const TTS_RATE_OPTIONS: { value: number; label: string }[] = [
  { value: 0.7, label: 'Lambat (0.7×)' },
  { value: 0.85, label: 'Agak Lambat (0.85×)' },
  { value: 1.0, label: 'Normal (1.0×)' },
  { value: 1.15, label: 'Agak Cepat (1.15×)' },
  { value: 1.3, label: 'Cepat (1.3×)' },
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();

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
  const voiceNoSpeechDelaySeconds = usePreferences(
    (s) => s.voiceNoSpeechDelaySeconds,
  );
  const setVoiceNoSpeechDelaySeconds = usePreferences(
    (s) => s.setVoiceNoSpeechDelaySeconds,
  );
  const ttsEnabled = usePreferences((s) => s.ttsEnabled);
  const setTtsEnabled = usePreferences((s) => s.setTtsEnabled);
  const ttsVoiceId = usePreferences((s) => s.ttsVoiceId);
  const setTtsVoiceId = usePreferences((s) => s.setTtsVoiceId);
  const ttsRate = usePreferences((s) => s.ttsRate);
  const setTtsRate = usePreferences((s) => s.setTtsRate);

  /* ── Products / voice guard ── */
  const { data: products = [] } = useProducts(user?.store_id);
  const activeProductCount = useMemo(
    () => products.filter((p) => p.is_active).length,
    [products],
  );

  const voiceGuard = useMemo(() => {
    if (!user?.store_id) {
      return {
        allowed: false,
        message: 'Belum ada toko. Voice Command memerlukan produk.',
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

  /* ── Modal state ── */
  const [keepAwakeConfirmOpen, setKeepAwakeConfirmOpen] = useState(false);
  const [quickPayConfirmOpen, setQuickPayConfirmOpen] = useState(false);
  const [voiceIdlePickerOpen, setVoiceIdlePickerOpen] = useState(false);
  const [voiceNoSpeechPickerOpen, setVoiceNoSpeechPickerOpen] =
    useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [ratePickerOpen, setRatePickerOpen] = useState(false);

  /* ── TTS voice state ── */
  const [voices, setVoices] = useState<Speech.Voice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  const initial = (user?.name ?? 'K').charAt(0).toUpperCase();
  const storeInitial = (user?.store?.name ?? 'T').charAt(0).toUpperCase();
  const storeAvatarUrl = user?.store?.avatar_url;

  /* ── Labels ── */
  const voiceIdleLabel = useMemo(() => {
    if (voiceIdleSeconds === 0) return 'Nonaktif';
    if (voiceIdleSeconds < 60) return `${voiceIdleSeconds} detik`;
    return `${voiceIdleSeconds / 60} menit`;
  }, [voiceIdleSeconds]);

  const voiceNoSpeechLabel = useMemo(
    () => `${voiceNoSpeechDelaySeconds} detik`,
    [voiceNoSpeechDelaySeconds],
  );

  const voiceLabel = useMemo(() => {
    if (!ttsVoiceId) return 'Sistem Default';
    const v = voices.find((x) => x.identifier === ttsVoiceId);
    return v?.name ?? 'Custom';
  }, [ttsVoiceId, voices]);

  const rateLabel = useMemo(() => {
    const opt = TTS_RATE_OPTIONS.find((o) => o.value === ttsRate);
    return opt?.label ?? `${ttsRate}×`;
  }, [ttsRate]);

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

  const handleOpenVoicePicker = async () => {
    setVoicePickerOpen(true);
    if (voices.length > 0 || isLoadingVoices) return;

    setIsLoadingVoices(true);
    try {
      const list = await getIndonesianVoices();
      setVoices(list);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handleSelectVoice = (voiceId: string | null) => {
    setTtsVoiceId(voiceId);
    setVoicePickerOpen(false);
    speakPreview('Teh Ori Mini dua ditambahkan', voiceId, ttsRate);
  };

  const handleSelectRate = (rate: number) => {
    setTtsRate(rate);
    setRatePickerOpen(false);
    speakPreview('Teh Ori Mini dua ditambahkan', ttsVoiceId, rate);
  };

  const handleTestVoice = () => {
    speak('Teh Ori Mini dua ditambahkan');
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

        {/* ═══ Suara (Beta) ═══ */}
        <SettingsSection title="Suara" icon={Mic}>
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
            beta
            right={
              <SettingsSwitch
                value={voiceEnabled && voiceGuard.allowed}
                onValueChange={setVoiceEnabled}
                disabled={!voiceGuard.allowed}
              />
            }
          />

          {voiceEnabled && voiceGuard.allowed ? (
            <>
              <SettingsDivider />
              <SettingsRow
                icon={Timer}
                label="Jeda Restart Mikrofon"
                description="Jeda sebelum mendengarkan lagi jika tidak ada suara"
                onPress={() => setVoiceNoSpeechPickerOpen(true)}
                right={
                  <View className="flex-row items-center gap-1.5">
                    <Text className="font-dm-medium text-xs text-muted-foreground dark:text-stone-400">
                      {voiceNoSpeechLabel}
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

              {ttsEnabled ? (
                <>
                  <SettingsDivider />
                  <SettingsRow
                    icon={AudioLines}
                    label="Profil Suara"
                    description="Pilih suara Google TTS"
                    onPress={handleOpenVoicePicker}
                    right={
                      <View className="flex-row items-center gap-1.5">
                        <Text
                          className="max-w-[100px] font-dm-medium text-xs text-muted-foreground dark:text-stone-400"
                          numberOfLines={1}
                        >
                          {voiceLabel}
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
                    icon={Gauge}
                    label="Kecepatan Suara"
                    description="Atur tempo bicara TTS"
                    onPress={() => setRatePickerOpen(true)}
                    right={
                      <View className="flex-row items-center gap-1.5">
                        <Text className="font-dm-medium text-xs text-muted-foreground dark:text-stone-400">
                          {rateLabel}
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
                    icon={Play}
                    label="Test Suara"
                    description="Dengarkan contoh dengan pengaturan ini"
                    onPress={handleTestVoice}
                  />
                </>
              ) : null}

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

      {/* ─── Voice idle picker ─── */}
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
                className={`flex-row items-center justify-between px-4 py-3 active:bg-muted/40 dark:active:bg-stone-800/40 ${
                  i < VOICE_IDLE_OPTIONS.length - 1
                    ? 'border-b border-border/40 dark:border-stone-800/60'
                    : ''
                }`}
              >
                <Text
                  className={`font-dm-medium text-sm ${
                    selected
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

      {/* ─── Voice no-speech picker ─── */}
      <BaseModal
        visible={voiceNoSpeechPickerOpen}
        onClose={() => setVoiceNoSpeechPickerOpen(false)}
        align="center"
        maxWidth={320}
      >
        <View className="w-full overflow-hidden rounded-2xl bg-white dark:bg-stone-900">
          <View className="border-b border-border/40 px-4 py-3 dark:border-stone-800/60">
            <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
              Jeda Restart Mikrofon
            </Text>
            <Text className="mt-0.5 font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
              Lebih lama = lebih toleran terhadap kesunyian
            </Text>
          </View>
          {VOICE_NO_SPEECH_OPTIONS.map((opt, i) => {
            const selected = voiceNoSpeechDelaySeconds === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => {
                  setVoiceNoSpeechDelaySeconds(opt.value);
                  setVoiceNoSpeechPickerOpen(false);
                }}
                accessibilityRole="button"
                className={`flex-row items-center justify-between px-4 py-3 active:bg-muted/40 dark:active:bg-stone-800/40 ${
                  i < VOICE_NO_SPEECH_OPTIONS.length - 1
                    ? 'border-b border-border/40 dark:border-stone-800/60'
                    : ''
                }`}
              >
                <Text
                  className={`font-dm-medium text-sm ${
                    selected
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

      {/* ─── TTS Voice picker ─── */}
      <BaseModal
        visible={voicePickerOpen}
        onClose={() => setVoicePickerOpen(false)}
        align="center"
        maxWidth={380}
      >
        <View className="w-full overflow-hidden rounded-2xl bg-white dark:bg-stone-900">
          <View className="border-b border-border/40 px-4 py-3 dark:border-stone-800/60">
            <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
              Profil Suara
            </Text>
            <Text className="mt-0.5 font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
              Pilih voice Google TTS bahasa Indonesia
            </Text>
          </View>

          {/* System default */}
          <Pressable
            onPress={() => handleSelectVoice(null)}
            accessibilityRole="button"
            className={`flex-row items-center justify-between px-4 py-3 active:bg-muted/40 dark:active:bg-stone-800/40 ${
              voices.length > 0
                ? 'border-b border-border/40 dark:border-stone-800/60'
                : ''
            }`}
          >
            <View className="flex-1">
              <Text
                className={`font-dm-medium text-sm ${
                  !ttsVoiceId
                    ? 'text-primary dark:text-sage-400'
                    : 'text-foreground dark:text-stone-50'
                }`}
              >
                Sistem Default
              </Text>
              <Text className="mt-0.5 font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
                Voice otomatis dari Android
              </Text>
            </View>
            {!ttsVoiceId ? (
              <Icon
                as={Check}
                size={18}
                className="text-primary dark:text-sage-400"
              />
            ) : null}
          </Pressable>

          {isLoadingVoices ? (
            <View className="items-center gap-2 px-4 py-6">
              <ActivityIndicator size="small" />
              <Text className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
                Memuat voice...
              </Text>
            </View>
          ) : null}

          {!isLoadingVoices && voices.length === 0 ? (
            <View className="gap-1 px-4 py-6">
              <View className="flex-row items-start gap-2">
                <Icon
                  as={AlertTriangle}
                  size={14}
                  className="mt-0.5 text-amber-700 dark:text-amber-400"
                />
                <Text className="flex-1 font-dm-regular text-[11px] leading-4 text-amber-800 dark:text-amber-300">
                  Voice Indonesia tidak terinstall. Buka Settings Android →
                  Accessibility → Text-to-speech output → Google TTS →
                  Install voice data → Indonesian.
                </Text>
              </View>
            </View>
          ) : null}

          {!isLoadingVoices &&
            voices.map((v, i) => {
              const isSelected = ttsVoiceId === v.identifier;
              return (
                <Pressable
                  key={v.identifier}
                  onPress={() => handleSelectVoice(v.identifier)}
                  accessibilityRole="button"
                  className={`flex-row items-center justify-between px-4 py-3 active:bg-muted/40 dark:active:bg-stone-800/40 ${
                    i < voices.length - 1
                      ? 'border-b border-border/40 dark:border-stone-800/60'
                      : ''
                  }`}
                >
                  <View className="flex-1 pr-2">
                    <Text
                      className={`font-dm-medium text-sm ${
                        isSelected
                          ? 'text-primary dark:text-sage-400'
                          : 'text-foreground dark:text-stone-50'
                      }`}
                      numberOfLines={1}
                    >
                      {v.name || v.identifier}
                    </Text>
                    <Text className="mt-0.5 font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
                      {v.language}
                      {v.quality ? ` · ${v.quality}` : ''}
                    </Text>
                  </View>
                  {isSelected ? (
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

      {/* ─── TTS Rate picker ─── */}
      <BaseModal
        visible={ratePickerOpen}
        onClose={() => setRatePickerOpen(false)}
        align="center"
        maxWidth={340}
      >
        <View className="w-full overflow-hidden rounded-2xl bg-white dark:bg-stone-900">
          <View className="border-b border-border/40 px-4 py-3 dark:border-stone-800/60">
            <Text className="font-dm-bold text-sm text-foreground dark:text-stone-50">
              Kecepatan Suara
            </Text>
            <Text className="mt-0.5 font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
              Semakin cepat, semakin singkat feedback
            </Text>
          </View>
          {TTS_RATE_OPTIONS.map((opt, i) => {
            const selected = ttsRate === opt.value;
            return (
              <Pressable
                key={opt.value}
                onPress={() => handleSelectRate(opt.value)}
                accessibilityRole="button"
                className={`flex-row items-center justify-between px-4 py-3 active:bg-muted/40 dark:active:bg-stone-800/40 ${
                  i < TTS_RATE_OPTIONS.length - 1
                    ? 'border-b border-border/40 dark:border-stone-800/60'
                    : ''
                }`}
              >
                <Text
                  className={`font-dm-medium text-sm ${
                    selected
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

      {/* ─── Confirm modals ─── */}
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