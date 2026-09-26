import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import {
  View,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Image,
  AccessibilityInfo,
  StyleSheet,
  useWindowDimensions,
  type TextInputProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react-native';
import { useSession } from '@/lib/session';
import { getErrorMessage } from '@/lib/api';
import { formatRupiah } from '@/lib/format';
import { useColorScheme } from 'nativewind';

/* ── Konfigurasi ── */
const APP_NAME = 'Latea App';
const APP_TAGLINE = 'Annuqayah Latee';
const LOGO = require('@/assets/images/icon.png');

const HOME_ROUTE = '/(app)';

/* ── Warna banner ── */
const GRADIENT_A = ['#EEF5F0', '#DCEBE1', '#CBDFD3'] as const;
const GRADIENT_B = ['#E9F1F4', '#D8E6EC', '#E4EEE7'] as const;

const CARD_SHADOW = {
  backgroundColor: '#FFFFFF',
  borderRadius: 28,
  shadowColor: '#0F172A',
  shadowOpacity: 0.12,
  shadowRadius: 32,
  shadowOffset: { width: 0, height: 16 },
  elevation: 14,
} as const;

/* ══════════════════════════════════════════════════════
   Hook animasi
   ══════════════════════════════════════════════════════ */
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduce
    );
    return () => sub.remove();
  }, []);
  return reduce;
}

function useEntrance(delay: number, reduce: boolean, distance = 16) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: 700,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [reduce]);

  return {
    opacity: v,
    transform: [
      {
        translateY: v.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  };
}

function useLoop(duration: number, reduce: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(v, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, duration]);
  return v;
}

/* ══════════════════════════════════════════════════════
   Login Screen
   ══════════════════════════════════════════════════════ */
export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  const { signIn } = useSession();

  const isSplit = width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const cardEntrance = useEntrance(0, reduceMotion, 24);

  async function handleSubmit() {
    if (loading) return;

    if (!email.trim() || !password) {
      setError('Isi email dan kata sandi terlebih dahulu.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.replace(HOME_ROUTE);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-muted/60 dark:bg-stone-950"
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <Animated.View
          style={[
            CARD_SHADOW,
            { width: '100%', maxWidth: isSplit ? 980 : 440 },
            cardEntrance,
          ]}
        >
          <View
            className="flex-row overflow-hidden rounded-[28px] border border-border/40 bg-white dark:border-stone-800 dark:bg-stone-900"
            style={isSplit ? { minHeight: 560 } : undefined}
          >
            {isSplit ? <Banner reduceMotion={reduceMotion} /> : null}

            {/* ── Form ── */}
            <View
              className={
                isSplit ? 'flex-[4] justify-center p-10' : 'flex-1 p-6'
              }
            >
              <View className="w-full gap-6">
                {!isSplit ? <Logo /> : null}

                <View className="gap-1.5">
                  <Text className="font-dm-extrabold text-2xl tracking-tight text-foreground dark:text-stone-50">
                    Masuk
                  </Text>
                  <Text className="font-dm-regular text-sm leading-5 text-muted-foreground dark:text-stone-400">
                    Gunakan akun yang diberikan oleh pemilik toko.
                  </Text>
                </View>

                <View className="gap-4">
                  {/* Email */}
                  <Field
                    label="Email"
                    icon={Mail}
                    value={email}
                    onChangeText={(t) => {
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

                  {/* Password */}
                  <Field
                    label="Kata sandi"
                    icon={Lock}
                    inputRef={passwordRef}
                    value={password}
                    onChangeText={(t) => {
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
                          showPassword
                            ? 'Sembunyikan kata sandi'
                            : 'Tampilkan kata sandi'
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

                  {error ? (
                    <View className="flex-row items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 dark:border-red-400/30 dark:bg-red-500/15">
                      <Icon
                        as={AlertCircle}
                        size={15}
                        className="mt-px text-destructive dark:text-red-400"
                      />
                      <Text className="flex-1 font-dm-regular text-xs leading-4 text-destructive dark:text-red-400">
                        {error}
                      </Text>
                    </View>
                  ) : null}
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
                    <Text className="font-dm-bold text-sm text-primary-foreground">
                      Masuk
                    </Text>
                  )}
                </Pressable>

                <Text className="text-center font-dm-regular text-xs leading-4 text-muted-foreground dark:text-stone-400">
                  Lupa kata sandi? Hubungi pemilik toko untuk mengatur ulang.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ══════════════════════════════════════════════════════
   Logo
   ══════════════════════════════════════════════════════ */
function Logo() {
  return (
    <View className="flex-row items-center gap-3">
      <Image
        source={LOGO}
        resizeMode="cover"
        style={{ width: 46, height: 46, borderRadius: 13 }}
        accessibilityLabel={`Logo ${APP_NAME}`}
      />
      <View>
        <Text className="font-dm-extrabold text-lg leading-tight tracking-tight text-foreground dark:text-stone-50">
          {APP_NAME}
        </Text>
        <Text className="font-dm-regular text-xs text-muted-foreground dark:text-stone-400">
          {APP_TAGLINE}
        </Text>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Field
   ══════════════════════════════════════════════════════ */
type FieldProps = TextInputProps & {
  label: string;
  icon: LucideIcon;
  right?: ReactNode;
  hasError?: boolean;
  inputRef?: Ref<TextInput>;
};

function Field({
  label,
  icon,
  right,
  hasError,
  inputRef,
  ...inputProps
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  const borderClass = hasError
    ? 'border-destructive dark:border-red-400'
    : focused
      ? 'border-primary dark:border-sage-400'
      : 'border-border dark:border-stone-700';

  return (
    <View className="gap-1.5">
      <Text className="font-dm-semibold text-xs text-foreground dark:text-stone-100">
        {label}
      </Text>

      <View
        className={`h-12 flex-row items-center gap-2.5 rounded-xl border-[1.5px] bg-white px-3.5 dark:bg-stone-800 ${borderClass}`}
      >
        <Icon
          as={icon}
          size={17}
          className={
            focused
              ? 'text-primary dark:text-sage-300'
              : 'text-muted-foreground dark:text-stone-500'
          }
        />
        <TextInput
          ref={inputRef}
          placeholderTextColor="#9CA3AF"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 py-0 font-dm-regular text-sm text-foreground dark:text-stone-50"
          {...inputProps}
        />
        {right}
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Banner
   ══════════════════════════════════════════════════════ */
const MESSAGES = [
  {
    title: 'Catat penjualan tanpa hambatan.',
    body: 'Pilih produk, hitung total, lalu terima pembayaran. Semuanya dalam satu layar.',
  },
  {
    title: 'Diskon dihitung otomatis.',
    body: 'Harga promo langsung berlaku begitu jumlah pembelian terpenuhi.',
  },
  {
    title: 'Antrean pelanggan lebih singkat.',
    body: 'Tampilan besar dan jelas, mudah dipakai saat toko sedang ramai.',
  },
];

function Banner({ reduceMotion }: { reduceMotion: boolean }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // ⭐ Gradient: light vs dark
  const gradientA = isDark
    ? (['#0F1F17', '#0A1712', '#071210'] as const)
    : GRADIENT_A;
  const gradientB = isDark
    ? (['#0A1418', '#091418', '#0A1712'] as const)
    : GRADIENT_B;

  const blend = useLoop(7000, reduceMotion);
  const drift1 = useLoop(9000, reduceMotion);
  const drift2 = useLoop(12000, reduceMotion);
  const float = useLoop(4200, reduceMotion);

  const logoIn = useEntrance(250, reduceMotion);
  const textIn = useEntrance(450, reduceMotion);
  const receiptIn = useEntrance(650, reduceMotion, 28);
  const footIn = useEntrance(1400, reduceMotion, 8);

  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setIdx((i) => (i + 1) % MESSAGES.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    }, 5500);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  const msg = MESSAGES[idx];

  return (
    <View
      className="flex-[5] justify-between overflow-hidden p-10 dark:bg-stone-950"
      style={{ minHeight: 560 }}
    >
      <LinearGradient
        colors={gradientA}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: blend }]}>
        <LinearGradient
          colors={gradientB}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Orb 1 — warna conditional */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -90,
          right: -70,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: isDark
            ? 'rgba(132,169,140,0.06)'
            : 'rgba(255,255,255,0.5)',
          transform: [
            {
              translateX: drift1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -28],
              }),
            },
            {
              translateY: drift1.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 22],
              }),
            },
          ],
        }}
      />

      {/* Orb 2 — warna conditional */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -80,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: isDark
            ? 'rgba(120,165,140,0.08)'
            : 'rgba(120,165,140,0.16)',
          transform: [
            {
              translateX: drift2.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 24],
              }),
            },
            {
              translateY: drift2.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -18],
              }),
            },
          ],
        }}
      />

      <Animated.View style={logoIn}>
        <Logo />
      </Animated.View>

      <View className="gap-7 py-6">
        <Animated.View style={[textIn, { gap: 12 }]}>
          <Animated.View
            style={{
              opacity: fade,
              minHeight: 108,
              transform: [
                {
                  translateY: fade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            }}
          >
            <Text className="max-w-[380px] font-dm-extrabold text-3xl leading-tight tracking-tight text-foreground dark:text-stone-50">
              {msg.title}
            </Text>
            <Text className="mt-2 max-w-[380px] font-dm-regular text-sm leading-5 text-muted-foreground dark:text-stone-400">
              {msg.body}
            </Text>
          </Animated.View>

          <View className="flex-row gap-1.5">
            {MESSAGES.map((_, i) => (
              <View
                key={i}
                className={`h-1.5 rounded-full ${
                  i === idx
                    ? 'w-5 bg-primary dark:bg-sage-400'
                    : 'w-1.5 bg-foreground/20 dark:bg-stone-100/20'
                }`}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View style={receiptIn}>
          <Animated.View
            style={{
              alignSelf: 'flex-end',
              transform: [
                { rotate: '-3deg' },
                {
                  translateY: float.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -6],
                  }),
                },
              ],
            }}
          >
            <ReceiptPreview reduceMotion={reduceMotion} />
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View style={footIn}>
        <Text className="font-dm-regular text-[11px] text-muted-foreground dark:text-stone-400">
          © {new Date().getFullYear()} {APP_NAME}
        </Text>
      </Animated.View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Receipt Preview
   ══════════════════════════════════════════════════════ */
const SAMPLE_LINES = [
  { emoji: '🧋', name: 'Es Teh Manis', qty: 3, price: 8000 },
  { emoji: '☕', name: 'Kopi Susu', qty: 2, price: 18000 },
  { emoji: '🥐', name: 'Roti Bakar', qty: 1, price: 22000 },
];

function ReceiptPreview({ reduceMotion }: { reduceMotion: boolean }) {
  const total = SAMPLE_LINES.reduce((a, l) => a + l.qty * l.price, 0);

  return (
    <View
      className="w-[300px] rounded-2xl bg-white p-5 dark:bg-stone-800"
      style={{
        shadowColor: '#0F172A',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      }}
      pointerEvents="none"
    >
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text className="font-dm-bold text-xs text-foreground dark:text-stone-50">
            {APP_TAGLINE}
          </Text>
          <Text className="font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
            Struk #0042
          </Text>
        </View>
        <Text className="font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
          Contoh
        </Text>
      </View>

      <Dashes />

      <View className="gap-2.5 py-3">
        {SAMPLE_LINES.map((l, i) => (
          <ReceiptRow
            key={l.name}
            line={l}
            delay={1000 + i * 220}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>

      <Dashes />

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="font-dm-bold text-xs text-foreground dark:text-stone-50">
          TOTAL
        </Text>
        <Text className="font-dm-extrabold text-lg leading-none tracking-tight text-primary dark:text-sage-300">
          {formatRupiah(total)}
        </Text>
      </View>
    </View>
  );
}

function ReceiptRow({
  line,
  delay,
  reduceMotion,
}: {
  line: (typeof SAMPLE_LINES)[number];
  delay: number;
  reduceMotion: boolean;
}) {
  const style = useEntrance(delay, reduceMotion, 8);

  return (
    <Animated.View
      style={[style, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
    >
      <View className="size-7 items-center justify-center rounded-md bg-accent/60 dark:bg-stone-700">
        <Text className="text-sm">{line.emoji}</Text>
      </View>
      <View className="flex-1">
        <Text
          className="font-dm-semibold text-[11px] text-foreground dark:text-stone-50"
          numberOfLines={1}
        >
          {line.name}
        </Text>
        <Text className="font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
          {line.qty} × {formatRupiah(line.price)}
        </Text>
      </View>
      <Text className="font-dm-bold text-[11px] text-foreground dark:text-stone-50">
        {formatRupiah(line.qty * line.price)}
      </Text>
    </Animated.View>
  );
}

function Dashes() {
  return (
    <View className="flex-row justify-between">
      {Array.from({ length: 30 }).map((_, i) => (
        <View key={i} className="h-px w-[5px] bg-border dark:bg-stone-700" />
      ))}
    </View>
  );
}