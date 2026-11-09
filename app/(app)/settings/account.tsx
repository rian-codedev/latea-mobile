import { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  AlertTriangle,
  Store as StoreIcon,
  User as UserIcon,
} from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/layout/screen';
import { GlassHeader } from '@/components/layout/glass-header';
import { IconButton } from '@/components/ui/icon-button';
import { Button } from '@/components/ui/button';
import { SuccessToast } from '@/components/feedback/success-toast';
import { AvatarPicker } from '@/components/features/settings/avatar-picker';
import { useSession } from '@/lib/stores/session';
import {
  updateProfile,
  uploadAvatar,
  updateStore,
  uploadStoreAvatar,
  parseFieldErrors,
  type PickedAvatar,
} from '@/lib/api/account';
import { getErrorMessage } from '@/lib/api/client';
import { ROUTES } from '@/lib/constants/app';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';

type FieldErrors = Partial<
  Record<
    'name' | 'email' | 'current_password' | 'store' | 'store_name',
    string
  >
>;

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const { user, setUser } = useSession();

  const isTablet = width >= 768;

  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeName, setStoreName] = useState(user?.store?.name ?? '');

  const [userAvatarFile, setUserAvatarFile] = useState<PickedAvatar | null>(
    null,
  );
  const [storeAvatarFile, setStoreAvatarFile] =
    useState<PickedAvatar | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [toast, setToast] = useState<{
    msg: string;
    variant: 'success' | 'error';
  } | null>(null);

  const emailChanged = email.trim() !== (user?.email ?? '');
  const nameChanged = name.trim() !== (user?.name ?? '');
  const storeNameChanged =
    storeName.trim() !== (user?.store?.name ?? '');
  const hasAvatarChanges = !!userAvatarFile || !!storeAvatarFile;

  const isDirty =
    nameChanged || emailChanged || storeNameChanged || hasAvatarChanges;

  const canSave =
    isDirty &&
    !isSaving &&
    name.trim().length > 0 &&
    (!emailChanged || currentPassword.length > 0) &&
    (!user?.store || storeName.trim().length > 0);

  /* ── Unsaved changes guard ── */
  useEffect(() => {
    if (!isDirty) return;

    const unsubscribe = navigation.addListener(
      'beforeRemove',
      (e: { preventDefault: () => void; data: { action: any } }) => {
        e.preventDefault();
        Alert.alert(
          'Batalkan perubahan?',
          'Perubahan yang belum disimpan akan hilang.',
          [
            { text: 'Tetap di sini', style: 'cancel' },
            {
              text: 'Batalkan',
              style: 'destructive',
              onPress: () => navigation.dispatch(e.data.action),
            },
          ],
        );
      },
    );

    return unsubscribe;
  }, [navigation, isDirty]);
  function showToast(
    msg: string,
    variant: 'success' | 'error' = 'success',
  ) {
    setToast({ msg, variant });
    setTimeout(
      () => setToast(null),
      variant === 'error' ? 5000 : 3000,
    );
  }

  async function handleSave() {
    if (!canSave) return;

    setErrors({});
    setIsSaving(true);

    try {
      let updated = user!;

      // 1. Upload user avatar (jika ada perubahan)
      if (userAvatarFile) {
        updated = await uploadAvatar(userAvatarFile);
      }

      // 2. Upload store avatar (jika ada perubahan)
      if (storeAvatarFile) {
        updated = await uploadStoreAvatar(storeAvatarFile);
      }

      // 3. Update profile (nama + email)
      if (nameChanged || emailChanged) {
        updated = await updateProfile({
          name: name.trim(),
          email: email.trim(),
          current_password: emailChanged ? currentPassword : undefined,
        });
      }

      // 4. Update store name
      if (storeNameChanged) {
        updated = await updateStore(storeName.trim());
      }

      // Update session user
      setUser(updated);

      // Reset pending states
      setUserAvatarFile(null);
      setStoreAvatarFile(null);
      setCurrentPassword('');
      setShowPassword(false);

      showToast('Perubahan berhasil disimpan');
    } catch (e) {
      const fieldErrors = parseFieldErrors(e);
      if (Object.keys(fieldErrors).length > 0) {
        const mapped: FieldErrors = {};
        if (fieldErrors.name) mapped.name = fieldErrors.name;
        if (fieldErrors.email) mapped.email = fieldErrors.email;
        if (fieldErrors.current_password)
          mapped.current_password = fieldErrors.current_password;
        if (fieldErrors.store) mapped.store = fieldErrors.store;
        setErrors(mapped);
      } else {
        showToast(getErrorMessage(e), 'error');
      }
    } finally {
      setIsSaving(false);
    }
  }

  const userInitial = (user?.name ?? 'K').charAt(0).toUpperCase();
  const storeInitial = (user?.store?.name ?? 'T')
    .charAt(0)
    .toUpperCase();

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + HEADER_HEIGHT + 16,
            paddingBottom: 24,
            paddingHorizontal: 16,
            gap: 20,
          }}
        >
          <View
            className={
              isTablet ? 'flex-row items-start gap-4' : 'gap-5'
            }
          >
            {/* ═══ Kolom 1 / Section 1: Personal ═══ */}
            <View className={isTablet ? 'flex-1 gap-4' : 'gap-4'}>
              <AvatarPicker
                currentUri={user?.avatar_url}
                fallbackInitial={userInitial}
                size={isTablet ? 120 : 96}
                onPicked={setUserAvatarFile}
              />

              <SectionLabel icon={UserIcon} label="Data Pribadi" />

              <View className="gap-3 rounded-2xl border border-border/40 bg-white p-4 dark:border-stone-800/60 dark:bg-stone-900">
                <FormField
                  label="Nama"
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (errors.name)
                      setErrors((e) => ({ ...e, name: undefined }));
                  }}
                  errorText={errors.name}
                  editable={!isSaving}
                  autoCapitalize="words"
                  maxLength={100}
                />

                <FormField
                  label="Email"
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (errors.email)
                      setErrors((e) => ({ ...e, email: undefined }));
                  }}
                  errorText={errors.email}
                  editable={!isSaving}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={150}
                />

                {emailChanged ? (
                  <View className="gap-1">
                    <FormField
                      label="Password"
                      value={currentPassword}
                      onChangeText={(t) => {
                        setCurrentPassword(t);
                        if (errors.current_password)
                          setErrors((e) => ({
                            ...e,
                            current_password: undefined,
                          }));
                      }}
                      errorText={errors.current_password}
                      editable={!isSaving}
                      secureTextEntry={!showPassword}
                      right={
                        <Pressable
                          onPress={() =>
                            setShowPassword((v) => !v)
                          }
                          hitSlop={10}
                          accessibilityLabel={
                            showPassword
                              ? 'Sembunyikan password'
                              : 'Tampilkan password'
                          }
                        >
                          <Icon
                            as={showPassword ? EyeOff : Eye}
                            size={16}
                            className="text-muted-foreground dark:text-stone-400"
                          />
                        </Pressable>
                      }
                    />
                    <Text className="font-dm-regular text-[10px] text-amber-700 dark:text-amber-400">
                      Password lama diperlukan untuk mengubah email
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ═══ Kolom 2 / Section 2: Store ═══ */}
            {user?.store ? (
              <View className={isTablet ? 'flex-1 gap-4' : 'gap-4'}>
                <AvatarPicker
                  currentUri={user.store.avatar_url}
                  fallbackInitial={storeInitial}
                  size={isTablet ? 100 : 80}
                  onPicked={setStoreAvatarFile}
                />

                <SectionLabel icon={StoreIcon} label="Data Toko" />

                <View className="gap-3 rounded-2xl border border-border/40 bg-white p-4 dark:border-stone-800/60 dark:bg-stone-900">
                  <FormField
                    label="Nama Toko"
                    value={storeName}
                    onChangeText={(t) => {
                      setStoreName(t);
                      if (errors.store_name)
                        setErrors((e) => ({
                          ...e,
                          store_name: undefined,
                        }));
                    }}
                    errorText={errors.store_name}
                    editable={!isSaving}
                    maxLength={100}
                  />
                  {errors.store ? (
                    <Text className="font-dm-regular text-[10px] text-destructive dark:text-red-400">
                      {errors.store}
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : (
              <View className={isTablet ? 'flex-1' : ''}>
                <View className="flex-row items-center gap-2 rounded-2xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                  <Icon
                    as={AlertTriangle}
                    size={16}
                    className="text-amber-700 dark:text-amber-400"
                  />
                  <Text className="flex-1 font-dm-medium text-xs text-amber-700 dark:text-amber-400">
                    Belum ada toko. Hubungi admin untuk penugasan.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* ═══ Keamanan ═══ */}
          <View className="gap-2">
            <SectionLabel icon={Lock} label="Keamanan" />
            <Pressable
              onPress={() =>
                router.push(ROUTES.settingsChangePassword)
              }
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-2xl border border-border/40 bg-white px-4 py-3 active:bg-muted/40 dark:border-stone-800/60 dark:bg-stone-900 dark:active:bg-stone-800/40"
            >
              <View className="size-9 items-center justify-center rounded-xl bg-accent/60 dark:bg-stone-800">
                <Icon
                  as={Lock}
                  size={16}
                  className="text-primary dark:text-sage-400"
                />
              </View>
              <Text className="flex-1 font-dm-semibold text-[13px] text-foreground dark:text-stone-50">
                Ubah Password
              </Text>
              <Icon
                as={ChevronRight}
                size={16}
                className="text-muted-foreground/60 dark:text-stone-500/60"
              />
            </Pressable>
          </View>
        </ScrollView>

        {/* ═══ Sticky Save ═══ */}
        <View
          className="border-t border-border/40 bg-white px-4 pt-3 dark:border-stone-800/60 dark:bg-stone-950"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <Button
            label="Simpan Perubahan"
            loading={isSaving}
            disabled={!canSave}
            onPress={handleSave}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>

      <GlassHeader>
        <IconButton
          icon={ArrowLeft}
          onPress={() =>
            router.canGoBack()
              ? router.back()
              : router.replace(ROUTES.settings)
          }
          accessibilityLabel="Kembali"
          disabled={isSaving}
        />
        <View className="flex-1">
          <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
            Pengaturan Akun
          </Text>
          <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            Kelola informasi akun & toko
          </Text>
        </View>
      </GlassHeader>

      <SuccessToast
        message={toast?.msg ?? null}
        variant={toast?.variant}
      />
    </Screen>
  );
}

/* ── Section label ── */
function SectionLabel({
  icon,
  label,
}: {
  icon: typeof Lock;
  label: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5 px-1">
      <Icon
        as={icon}
        size={12}
        className="text-muted-foreground dark:text-stone-400"
      />
      <Text className="font-dm-bold text-[11px] uppercase tracking-wider text-muted-foreground dark:text-stone-400">
        {label}
      </Text>
    </View>
  );
}

/* ── Form field with inline error ── */
function FormField({
  label,
  errorText,
  right,
  ...inputProps
}: {
  label: string;
  errorText?: string;
  right?: React.ReactNode;
} & React.ComponentProps<typeof TextInput>) {
  const hasError = !!errorText;

  return (
    <View className="gap-1.5">
      <Text className="font-dm-semibold text-xs text-foreground dark:text-stone-100">
        {label}
      </Text>
      <View
        className={`h-11 flex-row items-center gap-2 rounded-xl border-[1.5px] bg-white px-3.5 dark:bg-stone-900 ${
          hasError
            ? 'border-destructive dark:border-red-400'
            : 'border-border dark:border-stone-700'
        }`}
      >
        <TextInput
          placeholderTextColor="#9CA3AF"
          className="flex-1 py-0 font-dm-regular text-sm text-foreground dark:text-stone-50"
          style={{ textAlignVertical: 'center' }}
          {...inputProps}
        />
        {right}
      </View>
      {errorText ? (
        <Text className="font-dm-regular text-[10px] text-destructive dark:text-red-400">
          {errorText}
        </Text>
      ) : null}
    </View>
  );
}