import { useRef, useState } from 'react';
import {
  View,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Field } from '@/components/ui/field';
import { ErrorBanner } from '@/components/feedback/error-banner';
import { useSession } from '@/lib/stores/session';
import { getErrorMessage } from '@/lib/api/client';
import { useReduceMotion } from '@/lib/hooks/use-reduce-motion';
import { useEntrance } from '@/lib/hooks/use-entrance';
import { BrandLogo } from '@/components/features/auth/brand-logo';
import { LoginBanner } from '@/components/features/auth/login-banner';
import { ROUTES } from '@/lib/constants/app';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const { signIn } = useSession();

  const isSplit = width >= 768;
  const passwordRef = useRef<TextInput>(null);
  const cardEntrance = useEntrance(0, reduceMotion, 24);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (loading) return;
    if (!email.trim() || !password) return setError('Isi email dan kata sandi terlebih dahulu.');

    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace(ROUTES.home);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      // ⭐ iOS: padding, Android: height (resize agar tombol tetap terlihat)
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      className="flex-1 bg-muted/60 dark:bg-stone-950"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={{ width: '100%', maxWidth: isSplit ? 980 : 440 }}>
          <View
            className="flex-row overflow-hidden rounded-[28px] border border-border/40 bg-white dark:border-stone-800 dark:bg-stone-900"
            style={isSplit ? { minHeight: 560 } : undefined}
          >
            {isSplit ? <LoginBanner reduceMotion={reduceMotion} /> : null}

            <View className={isSplit ? 'flex-[4] justify-center p-10' : 'flex-1 p-6'}>
              <View className="w-full gap-6">
                {!isSplit ? <BrandLogo /> : null}

                <View className="gap-1.5">
                  <Text className="font-dm-extrabold text-2xl tracking-tight text-foreground dark:text-stone-50">
                    Masuk
                  </Text>
                  <Text className="font-dm-regular text-sm leading-5 text-muted-foreground dark:text-stone-400">
                    Gunakan akun yang diberikan oleh pemilik toko.
                  </Text>
                </View>

                <View className="gap-4">
                  <Field
                    label="Email"
                    icon={Mail}
                    value={email}
                    onChangeText={(t: string) => {
                      setEmail(t);
                      if (error) setError(null);
                    }}
                    placeholder="kasir@latea.test"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    submitBehavior="submit"
                    hasError={!!error}
                    editable={!loading}
                  />

                  <Field
                    label="Kata sandi"
                    icon={Lock}
                    inputRef={passwordRef}
                    value={password}
                    onChangeText={(t: string) => {
                      setPassword(t);
                      if (error) setError(null);
                    }}
                    placeholder="Masukkan kata sandi"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={handleSubmit}
                    hasError={!!error}
                    editable={!loading}
                    right={
                      <Pressable
                        onPress={() => setShowPassword((v) => !v)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={
                          showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                        }
                      >
                        <Icon
                          as={showPassword ? EyeOff : Eye}
                          size={18}
                          className="text-muted-foreground dark:text-stone-400"
                        />
                      </Pressable>
                    }
                  />

                  {error ? <ErrorBanner message={error} /> : null}
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={loading}
                  accessibilityRole="button"
                  className="h-12 flex-row items-center justify-center gap-2 rounded-full bg-primary active:opacity-90 dark:bg-sage-500"
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text className="font-dm-bold text-sm text-primary-foreground">
                        Memeriksa akun...
                      </Text>
                    </>
                  ) : (
                    <Text className="font-dm-bold text-sm text-primary-foreground">Masuk</Text>
                  )}
                </Pressable>

                <Text className="text-center font-dm-regular text-xs leading-4 text-muted-foreground dark:text-stone-400">
                  Lupa kata sandi? Hubungi pemilik toko untuk mengatur ulang.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}