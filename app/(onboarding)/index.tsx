import { useEffect, useRef, useState, useMemo, memo } from 'react';
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
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useFirstLaunch } from '@/lib/use-first-launch';

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

/* ══════════════════════════════════════════════════════
   Theme Tokens
   ══════════════════════════════════════════════════════ */
type Theme = 'light' | 'dark';

const THEME = {
  light: {
    gradient: ['#F9E4BC', '#FEF9ED', '#F5FAF5'] as const,
    orb1: 'rgba(132,169,140,0.18)',
    orb2: 'rgba(249,228,188,0.30)',
    orb3: 'rgba(200,220,205,0.15)',
    cardShadow: '#0F172A',
    cardShadowOpacity: 0.1,
    cardBg: '#FFFFFF',
  },
  dark: {
    gradient: ['#1A1612', '#0F0E0B', '#0D1410'] as const,
    orb1: 'rgba(132,169,140,0.10)',
    orb2: 'rgba(200,180,120,0.06)',
    orb3: 'rgba(132,169,140,0.05)',
    cardShadow: '#000000',
    cardShadowOpacity: 0.5,
    cardBg: '#1C1917',
  },
} as const;

const LOGIN_ROUTE = '/(auth)/login' as any;

/* ══════════════════════════════════════════════════════
   Hooks
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

/* ⭐ Memoized illustration — tidak re-render saat state lain berubah */
const MemoIllustration = memo(
  function MemoIllustration({
    Component,
    size,
  }: {
    Component: React.ComponentType<any>;
    size: number;
  }) {
    return (
      <View
        style={{ width: size, height: size }}
        className="items-center justify-center"
      >
        <Component
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid meet"
        />
      </View>
    );
  },
  (prev, next) => prev.Component === next.Component && prev.size === next.size
);

/* ══════════════════════════════════════════════════════
   Main Screen
   ══════════════════════════════════════════════════════ */
export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { markLaunched } = useFirstLaunch();
  const reduceMotion = useReduceMotion();

  const { colorScheme } = useColorScheme();
  const theme: Theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = THEME[theme];
  const isDark = theme === 'dark';

  const isTablet = width >= 768;
  const SCREEN_W = width;
  const SCREEN_H = height;

  const [idx, setIdx] = useState(0);
  const [renderIdx, setRenderIdx] = useState(0);
  const isLast = idx === SLIDES.length - 1;
  const direction = useRef(1);
  const isAnimating = useRef(false);

  /* ⭐ Animation values — dipisah agar tidak konflik */
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateX = useRef(new Animated.Value(0)).current;

  const cardEntrance = useEntrance(reduceMotion, 24);

  /* Orbs */
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;

  /* Illustration float */
  const illustrationFloat = useRef(new Animated.Value(0)).current;

  /* Back button fade */
  const backButtonFade = useRef(new Animated.Value(0)).current;

  const orbSizes = useMemo(() => {
    return {
      orb1: isTablet
        ? Math.min(width * 0.65, 650)
        : Math.min(width * 0.7, 420),
      orb2: isTablet
        ? Math.min(width * 0.7, 700)
        : Math.min(width * 0.75, 450),
      orb3: isTablet
        ? Math.min(width * 0.4, 400)
        : Math.min(width * 0.4, 240),
    };
  }, [width, isTablet]);

  /* ── Floating animations ── */
  useEffect(() => {
    if (reduceMotion) return;

    const float = (orb: Animated.Value, duration: number, distance: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(orb, {
            toValue: distance,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(orb, {
            toValue: -distance,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      );

    const o1 = float(orb1Y, 3500, 12);
    const o2 = float(orb2Y, 4200, -15);
    const o3 = float(orb3Y, 3000, 8);

    const illus = Animated.loop(
      Animated.sequence([
        Animated.timing(illustrationFloat, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(illustrationFloat, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    o1.start();
    o2.start();
    o3.start();
    illus.start();

    return () => {
      o1.stop();
      o2.stop();
      o3.stop();
      illus.stop();
    };
  }, [reduceMotion]);

  /* ── Back button fade ── */
  useEffect(() => {
    if (reduceMotion) {
      backButtonFade.setValue(idx > 0 ? 1 : 0);
      return;
    }
    Animated.timing(backButtonFade, {
      toValue: idx > 0 ? 1 : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [idx, reduceMotion]);

  /* ⭐ Transition — fade OUT → change content → fade IN */
  function goTo(next: number) {
    if (isAnimating.current) return;
    if (next === idx || next < 0 || next > SLIDES.length - 1) return;

    const dir = next > idx ? 1 : -1;
    direction.current = dir;

    if (reduceMotion) {
      setIdx(next);
      setRenderIdx(next);
      return;
    }

    isAnimating.current = true;

    // 1. Exit — slide & fade out ke arah berlawanan
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateX, {
        toValue: -30 * dir, // geser keluar ke kiri jika next
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        isAnimating.current = false;
        return;
      }

      // 2. Update content setelah fade out
      setIdx(next);
      setRenderIdx(next);

      // 3. Prep entry — dari sisi berlawanan
      contentTranslateX.setValue(30 * dir);

      // 4. Enter — slide & fade in
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(contentTranslateX, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        isAnimating.current = false;
      });
    });
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

  /* ⭐ Content style */
  const contentStyle = reduceMotion
    ? undefined
    : {
        opacity: contentOpacity,
        transform: [{ translateX: contentTranslateX }],
      };

  const illustrationFloatStyle = reduceMotion
    ? undefined
    : {
        transform: [
          {
            translateY: illustrationFloat.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -10],
            }),
          },
        ],
      };

  const shownSlide = SLIDES[renderIdx];
  const Illustration = shownSlide.illustration;

  const illustrationSize = isTablet ? 280 : 200;

  return (
    <View className="flex-1 bg-white dark:bg-stone-950">
      {/* ⭐ Gradient — HANYA SATU layer (yang kedua mubazir) */}
      <View className="absolute inset-0">
        <LinearGradient
          colors={[...colors.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>

      {/* Orbs */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -SCREEN_H * 0.08,
          right: -SCREEN_W * 0.15,
          width: orbSizes.orb1,
          height: orbSizes.orb1,
          borderRadius: orbSizes.orb1 / 2,
          backgroundColor: colors.orb1,
          transform: [{ translateY: orb1Y }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -SCREEN_H * 0.05,
          left: -SCREEN_W * 0.2,
          width: orbSizes.orb2,
          height: orbSizes.orb2,
          borderRadius: orbSizes.orb2 / 2,
          backgroundColor: colors.orb2,
          transform: [{ translateY: orb2Y }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: SCREEN_H * 0.42,
          left: SCREEN_W * 0.05,
          width: orbSizes.orb3,
          height: orbSizes.orb3,
          borderRadius: orbSizes.orb3 / 2,
          backgroundColor: colors.orb3,
          transform: [{ translateY: orb3Y }],
        }}
      />

      <View
        className="flex-1 items-center justify-center px-6"
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
        }}
      >
        {/* Lewati */}
        <View
          className="absolute right-6 z-10"
          style={{ top: insets.top + 16 }}
        >
          <Pressable onPress={finish} hitSlop={10}>
            <Text className="font-dm-medium text-xs text-muted-foreground dark:text-stone-400">
              Lewati
            </Text>
          </Pressable>
        </View>

        {/* Card */}
        <Animated.View
          style={[
            {
              backgroundColor: colors.cardBg,
              borderRadius: 28,
              shadowColor: colors.cardShadow,
              shadowOpacity: colors.cardShadowOpacity,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 14 },
              elevation: 12,
            },
            { width: '100%', maxWidth: isTablet ? 560 : 420 },
            cardEntrance,
          ]}
          className="relative border border-border/40 dark:border-stone-800/60"
        >
          {/* Tombol kembali */}
          <Animated.View
            style={{
              position: 'absolute',
              top: isTablet ? 20 : 14,
              left: isTablet ? 20 : 14,
              zIndex: 10,
              opacity: backButtonFade,
              transform: [
                {
                  translateX: backButtonFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-8, 0],
                  }),
                },
              ],
            }}
            pointerEvents={idx > 0 ? 'auto' : 'none'}
          >
            <Pressable
              onPress={() => goTo(idx - 1)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Kembali ke slide sebelumnya"
              className="size-8 items-center justify-center rounded-full active:bg-muted/50 dark:active:bg-stone-800/50"
            >
              <Icon
                as={ArrowLeft}
                size={16}
                className="text-muted-foreground dark:text-stone-400"
              />
            </Pressable>
          </Animated.View>

          <View
            className={isTablet ? 'gap-8 px-12 py-12' : 'gap-6 px-6 py-8'}
          >
            {/* ⭐ Konten slide — dengan minHeight biar tidak shift */}
            <Animated.View
              style={[
                contentStyle,
                {
                  minHeight: isTablet ? 420 : 340,
                },
              ]}
              className="items-center justify-center gap-6"
            >
              {/* Ilustrasi mengambang */}
              <Animated.View
                style={illustrationFloatStyle}
                className="items-center justify-center"
              >
                <MemoIllustration
                  Component={Illustration}
                  size={illustrationSize}
                />
              </Animated.View>

              {/* Title + Body */}
              <View className="items-center gap-2.5">
                <Text
                  className={`text-center font-dm-extrabold tracking-tight text-foreground dark:text-stone-50 ${
                    isTablet ? 'text-3xl' : 'text-2xl'
                  }`}
                >
                  {shownSlide.title}
                </Text>

                <View
                  style={{
                    minHeight: 72,
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                  }}
                >
                  <Text
                    className={`text-center font-dm-regular leading-6 text-muted-foreground dark:text-stone-400 ${
                      isTablet
                        ? 'max-w-[380px] text-base'
                        : 'max-w-[280px] text-sm'
                    }`}
                    numberOfLines={3}
                  >
                    {shownSlide.body}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Dots */}
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
                      i === idx
                        ? 'w-5 bg-primary dark:bg-sage-400'
                        : 'w-1.5 bg-foreground/15 dark:bg-stone-100/15'
                    }`}
                  />
                </Pressable>
              ))}
            </View>

            {/* Tombol Next */}
            <View className="items-center">
              <NextButton
                label={isLast ? 'Mulai Sekarang' : 'Lanjut'}
                onPress={handleNext}
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Next Button
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
        className="flex-row items-center justify-center gap-2 rounded-full bg-primary/90 px-8 dark:bg-sage-500/90"
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