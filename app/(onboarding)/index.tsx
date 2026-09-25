import { useEffect, useRef, useState } from 'react';
import {
  View,
  Pressable,
  Animated,
  Easing,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useFirstLaunch } from '@/lib/use-first-launch';

// ⭐ Import 3 ilustrasi berbeda
import Illustration1 from '@/assets/illustrations/onboarding-1.svg';
import Illustration2 from '@/assets/illustrations/onboarding-2.svg';
import Illustration3 from '@/assets/illustrations/onboarding-3.svg';

/* ══════════════════════════════════════════════════════
   Data Slides
   ══════════════════════════════════════════════════════ */
const SLIDES = [
  {
    illustration: Illustration1,
    title: 'Transaksi cepat',
    body: 'Pilih produk, hitung total, dan terima pembayaran dalam satu layar.',
  },
  {
    illustration: Illustration2,
    title: 'Produk terorganisir',
    body: 'Semua produk toko Anda tersedia langsung di aplikasi.',
  },
  {
    illustration: Illustration3,
    title: 'Pantau penjualan',
    body: 'Lihat performa hari ini — total penjualan, transaksi, dan item terjual.',
  },
] as const;

// Gradasi lembut untuk latar, satu per slide
const GRADIENTS = [
  ['#FBF3E3', '#FDFBF5', '#EFF5EF'],
  ['#EFF3EC', '#FAFAF6', '#EAF1F4'],
  ['#EDF2F4', '#FBFAF6', '#F1F0E9'],
] as const;

const CARD_SHADOW = {
  backgroundColor: '#FFFFFF',
  borderRadius: 28,
  shadowColor: '#0F172A',
  shadowOpacity: 0.1,
  shadowRadius: 28,
  shadowOffset: { width: 0, height: 14 },
  elevation: 12,
} as const;

const LOGIN_ROUTE = '/(auth)/login' as any;

/* ══════════════════════════════════════════════════════
   Hook: hormati pengaturan "Kurangi gerakan"
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

/* ── Masuk sekali: fade + geser naik ── */
function useEntrance(reduce: boolean, distance = 18) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    const anim = Animated.timing(v, {
      toValue: 1,
      duration: 600,
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

/* ══════════════════════════════════════════════════════
   Main Screen
   ══════════════════════════════════════════════════════ */
export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { markLaunched } = useFirstLaunch();
  const reduceMotion = useReduceMotion();

  const isTablet = width >= 768;

  const [idx, setIdx] = useState(0);
  const [renderIdx, setRenderIdx] = useState(0);
  const isLast = idx === SLIDES.length - 1;
  const direction = useRef(1);

  // Transisi konten antar slide
  const progress = useRef(new Animated.Value(1)).current;
  const gradientFade = useRef(new Animated.Value(1)).current;

  // Card masuk sekali saat layar dibuka
  const cardEntrance = useEntrance(reduceMotion, 24);

  function goTo(next: number) {
    if (next === idx || next < 0 || next > SLIDES.length - 1) return;
    direction.current = next > idx ? 1 : -1;
    setIdx(next);

    if (reduceMotion) {
      setRenderIdx(next);
      return;
    }

    progress.setValue(0);
    gradientFade.setValue(0);
    Animated.parallel([
      Animated.timing(progress, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(gradientFade, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
    setRenderIdx(next);
  }

  async function finish() {
    await markLaunched();
    router.replace(LOGIN_ROUTE);
  }

  function handleNext() {
    if (isLast) {
      finish();
    } else {
      goTo(idx + 1);
    }
  }

  const contentStyle = reduceMotion
    ? undefined
    : {
        opacity: progress,
        transform: [
          {
            translateX: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [22 * direction.current, 0],
            }),
          },
        ],
      };

  const shownSlide = SLIDES[renderIdx];
  const Illustration = shownSlide.illustration;

  /* Ukuran ilustrasi responsif */
  const illustrationSize = isTablet ? 280 : 200;

  return (
    <View className="flex-1">
      {/* ── Latar gradasi, berganti halus per slide ── */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={GRADIENTS[renderIdx]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>
      <Animated.View
        className="absolute inset-0"
        style={{ opacity: gradientFade }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={GRADIENTS[idx]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.6, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <View
        className="flex-1 items-center justify-center px-6"
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* ── Skip, di luar card, kanan atas ── */}
        <View
          className="absolute right-6 z-10"
          style={{ top: insets.top + 16 }}
        >
          <Pressable onPress={finish} hitSlop={10}>
            <Text className="font-dm-medium text-xs text-muted-foreground">
              Lewati
            </Text>
          </Pressable>
        </View>

        {/* ── Card ── */}
        <Animated.View
          style={[
            CARD_SHADOW,
            { width: '100%', maxWidth: isTablet ? 560 : 420 },
            cardEntrance,
          ]}
          className="border border-border/40"
        >
          <View
            className={isTablet ? 'gap-8 px-12 py-12' : 'gap-6 px-6 py-8'}
          >
            {/* ── Konten slide ── */}
            <Animated.View
              style={contentStyle}
              className="items-center gap-6"
            >
              {/* ⭐ Ilustrasi SVG per slide */}
              <View
                style={{
                  width: illustrationSize,
                  height: illustrationSize,
                }}
                className="items-center justify-center"
              >
                <Illustration
                  width="100%"
                  height="100%"
                  preserveAspectRatio="xMidYMid meet"
                />
              </View>

              {/* Title + Body */}
              <View className="items-center gap-2.5">
                <Text
                  className={`text-center font-dm-extrabold tracking-tight text-foreground ${
                    isTablet ? 'text-3xl' : 'text-2xl'
                  }`}
                >
                  {shownSlide.title}
                </Text>
                <Text
                  className={`text-center font-dm-regular leading-6 text-muted-foreground ${
                    isTablet
                      ? 'max-w-[380px] text-base'
                      : 'max-w-[280px] text-sm'
                  }`}
                >
                  {shownSlide.body}
                </Text>
              </View>
            </Animated.View>

            {/* ── Dots ── */}
            <View className="flex-row justify-center gap-2">
              {SLIDES.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => goTo(i)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Ke slide ${i + 1}`}
                >
                  <View
                    className={`h-1.5 rounded-full ${
                      i === idx ? 'w-5 bg-primary' : 'w-1.5 bg-foreground/15'
                    }`}
                  />
                </Pressable>
              ))}
            </View>

            {/* ── Tombol ── */}
            <View className="items-center gap-3">
              <NextButton
                label={isLast ? 'Mulai Sekarang' : 'Lanjut'}
                onPress={handleNext}
              />

              {idx > 0 ? (
                <Pressable
                  onPress={() => goTo(idx - 1)}
                  hitSlop={10}
                  className="flex-row items-center gap-1 px-2 py-1"
                >
                  <Icon
                    as={ArrowLeft}
                    size={13}
                    className="text-muted-foreground"
                  />
                  <Text className="font-dm-medium text-xs text-muted-foreground">
                    Kembali
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Next Button — pill di tengah, warna lembut + animasi tekan
   ══════════════════════════════════════════════════════ */
function NextButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }
  function pressOut() {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        accessibilityRole="button"
        className="flex-row items-center justify-center gap-2 rounded-full bg-primary/90 px-8"
        style={{
          height: 52,
          shadowColor: '#0F172A',
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        }}
      >
        <Text className="font-dm-bold text-sm text-primary-foreground">
          {label}
        </Text>
        <Icon as={ArrowRight} size={16} className="text-primary-foreground" />
      </Pressable>
    </Animated.View>
  );
}