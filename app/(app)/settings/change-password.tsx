import { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { router, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/layout/screen';
import { GlassHeader } from '@/components/layout/glass-header';
import { IconButton } from '@/components/ui/icon-button';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/feedback/error-banner';
import { SuccessToast } from '@/components/feedback/success-toast';
import { useSession } from '@/lib/stores/session';
import { updatePassword, parseFieldErrors } from '@/lib/api/account';
import { getErrorMessage } from '@/lib/api/client';
import { ROUTES } from '@/lib/constants/app';
import { HEADER_HEIGHT } from '@/lib/theme/sizing';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { signOutLocally } = useSession();

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    current_password?: string;
    new_password?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isDirty =
    current.length > 0 || next.length > 0 || confirm.length > 0;

  const canSubmit =
    current.length > 0 &&
    next.length >= 8 &&
    confirm === next &&
    !isSaving;

  /* ── Unsaved guard ── */
  useEffect(() => {
    if (!isDirty || isSaving) return;

    const unsubscribe = navigation.addListener(
      'beforeRemove',
      (e: { preventDefault: () => void; data: { action: any } }) => {
        e.preventDefault();
        Alert.alert(
          'Batalkan perubahan?',
          'Password yang sudah Anda ketik akan hilang.',
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
  }, [navigation, isDirty, isSaving]);

  async function handleSubmit() {
    if (!canSubmit) return;

    setError(null);
    setFieldErrors({});

    if (next !== confirm) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (next === current) {
      setError('Password baru tidak boleh sama dengan password lama.');
      return;
    }

    setIsSaving(true);

    try {
      await updatePassword({
        current_password: current,
        new_password: next,
        new_password_confirmation: confirm,
      });

      // Local toast on this page (P35-B)
      setToast('Password berhasil diubah. Silakan login ulang.');

      // Wait 1 detik, lalu logout lokal
      setTimeout(async () => {
        await signOutLocally();
        // Layout (app)/_layout akan auto-redirect ke login
      }, 1000);
    } catch (e) {
      const fields = parseFieldErrors(e);
      if (
        fields.current_password ||
        fields.new_password
      ) {
        setFieldErrors({
          current_password: fields.current_password,
          new_password: fields.new_password,
        });
      } else {
        setError(getErrorMessage(e));
      }
      setIsSaving(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + HEADER_HEIGHT + 24,
            paddingBottom: 24,
            paddingHorizontal: 16,
            gap: 16,
          }}
        >
          <View className="gap-1.5">
            <Text className="font-dm-extrabold text-xl tracking-tight text-foreground dark:text-stone-50">
              Ubah Password
            </Text>
            <Text className="font-dm-regular text-sm leading-5 text-muted-foreground dark:text-stone-400">
              Setelah password diubah, Anda akan diminta login ulang.
            </Text>
          </View>

          <PasswordField
            label="Password Lama"
            value={current}
            onChangeText={(t) => {
              setCurrent(t);
              if (fieldErrors.current_password)
                setFieldErrors((fe) => ({
                  ...fe,
                  current_password: undefined,
                }));
            }}
            errorText={fieldErrors.current_password}
            secureTextEntry={!showCurrent}
            right={
              <EyeToggle
                show={showCurrent}
                onToggle={() => setShowCurrent((v) => !v)}
              />
            }
            editable={!isSaving}
          />

          <PasswordField
            label="Password Baru (min. 8 karakter)"
            value={next}
            onChangeText={(t) => {
              setNext(t);
              if (fieldErrors.new_password)
                setFieldErrors((fe) => ({
                  ...fe,
                  new_password: undefined,
                }));
            }}
            errorText={fieldErrors.new_password}
            secureTextEntry={!showNext}
            right={
              <EyeToggle
                show={showNext}
                onToggle={() => setShowNext((v) => !v)}
              />
            }
            editable={!isSaving}
          />

          <PasswordField
            label="Konfirmasi Password Baru"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showConfirm}
            right={
              <EyeToggle
                show={showConfirm}
                onToggle={() => setShowConfirm((v) => !v)}
              />
            }
            editable={!isSaving}
          />

          {error ? <ErrorBanner message={error} /> : null}
        </ScrollView>

        <View
          className="border-t border-border/40 bg-white px-4 pt-3 dark:border-stone-800/60 dark:bg-stone-950"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <Button
            label="Simpan Password Baru"
            loading={isSaving}
            disabled={!canSubmit}
            onPress={handleSubmit}
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
              : router.replace(ROUTES.settingsAccount)
          }
          accessibilityLabel="Kembali"
          disabled={isSaving}
        />
        <View className="flex-1">
          <Text className="font-dm-bold text-base text-foreground dark:text-stone-50">
            Ubah Password
          </Text>
          <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
            Untuk keamanan akun Anda
          </Text>
        </View>
      </GlassHeader>

      <SuccessToast message={toast} variant="success" />
    </Screen>
  );
}

/* ── Password field with error ── */
function PasswordField({
  label,
  errorText,
  right,
  ...props
}: {
  label: string;
  errorText?: string;
  right: React.ReactNode;
} & React.ComponentProps<typeof TextInput>) {
  const hasError = !!errorText;

  return (
    <View className="gap-1.5">
      <Text className="font-dm-semibold text-xs text-foreground dark:text-stone-100">
        {label}
      </Text>
      <View
        className={`h-12 flex-row items-center gap-2.5 rounded-xl border-[1.5px] bg-white px-3.5 dark:bg-stone-900 ${
          hasError
            ? 'border-destructive dark:border-red-400'
            : 'border-border dark:border-stone-700'
        }`}
      >
        <Icon
          as={Lock}
          size={16}
          className="text-muted-foreground dark:text-stone-400"
        />
        <TextInput
          placeholderTextColor="#9CA3AF"
          className="flex-1 py-0 font-dm-regular text-sm text-foreground dark:text-stone-50"
          style={{ textAlignVertical: 'center' }}
          {...props}
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

function EyeToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={show ? 'Sembunyikan' : 'Tampilkan'}
    >
      <Icon
        as={show ? EyeOff : Eye}
        size={16}
        className="text-muted-foreground dark:text-stone-400"
      />
    </Pressable>
  );
}