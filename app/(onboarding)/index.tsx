import { useEffect, useRef, useState, useMemo } from 'react';
import { View, Pressable, Animated, Easing, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { ArrowLeft } from 'lucide-react-native';

import { useReduceMotion } from '@/lib/hooks/use-reduce-motion';
import { useEntrance } from '@/lib/hooks/use-entrance';
import { useFirstLaunch } from '@/lib/hooks/use-first-launch';
import { WARM_GRADIENT } from '@/lib/theme/gradients';
import { ROUTES } from '@/lib/constants/app';

import { SlideContent } from '@/components/features/onboarding/slide-content';
import { SlideDots } from '@/components/features/onboarding/slide-dots';
import { NextButton } from '@/components/features/onboarding/next-button';

import Illustration1 from '@/assets/illustrations/onboarding-1.svg';
import Illustration2 from '@/assets/illustrations/onboarding-2.svg';
import Illustration3 from '@/assets/illustrations/onboarding-3.svg';

/* ── Data ── */
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

/* ── Token khusus onboarding ── */
const TOKENS = {
  light: {
    orb1: 'rgba(132,169,140,0.18)',
    orb2: 'rgba(249,228,188,0.30)',
    orb3: 'rgba(200,220,205,0.15)',
    cardShadow: '#0F172A',
    cardShadowOpacity: 0.1,
    cardBg: '#FFFFFF',
  },
  dark: {
    orb1: 'rgba(132,169,140,0.10)',
    orb2: 'rgba(200,180,120,0.06)',
    orb3: 'rgba(132,169,140,0.05)',
    cardShadow: '#000000',
    cardShadowOpacity: 0.5,
    cardBg: '#1C1917',
  },
} as const;

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { markLaunched } = useFirstLaunch();
  const reduceMotion = useReduceMotion();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tokens = isDark ? TOKENS.dark : TOKENS.light;
  const gradient = isDark ? WARM_GRADIENT.dark : WARM_GRADIENT.light;

  const isTablet = width >= 768;
  const SCREEN_W = width;
  const SCREEN_H = height;

  const [idx, setIdx] = useState(0);
  const [renderIdx, setRenderIdx] = useState(0);
  const isLast = idx === SLIDES.length - 1;
  const isAnimating = useRef(false);

  /* Animation values */
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const contentTranslateX = useRef(new Animated.Value(0)).current;
  const cardEntrance = useEntrance(0, reduceMotion, 24);

  /* Floating */
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;
  const illustrationFloat = useRef(new Animated.Value(0)).current;

  /* Back button fade */
  const backButtonFade = useRef(new Animated.Value(0)).current;

  const orbSizes = useMemo(
    () => ({
      orb1: isTablet ? Math.min(width * 0.65, 650) : Math.min(width * 0.7, 420),
      orb2: isTablet ? Math.min(width * 0.7, 700) : Math.min(width * 0.75, 450),
      orb3: isTablet ? Math.min(width * 0.4, 400) : Math.min(width * 0.4, 240),
    }),
    [width, isTablet],
  );

  /* Floating animations */
  useEffect(() => {
    if (reduceMotion) return;

    const float = (v: Animated.Value, duration: number, distance: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: distance,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: -distance,
            duration,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );

    const o1 = float(orb1Y, 3500, 12);
    const o2 = float(orb2Y, 4200, -15);
    const o3 = float(orb3Y, 3000, 8);
    const il = float(illustrationFloat, 2400, 10);

    o1.start();
    o2.start();
    o3.start();
    il.start();

    return () => {
      o1.stop();
      o2.stop();
      o3.stop();
      il.stop();
    };
  }, [reduceMotion]);

  /* Back button fade */
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

  /* Slide transition */
  function goTo(next: number) {
    if (isAnimating.current) return;
    if (next === idx || next < 0 || next > SLIDES.length - 1) return;

    const dir = next > idx ? 1 : -1;

    if (reduceMotion) {
      setIdx(next);
      setRenderIdx(next);
      return;
    }

    isAnimating.current = true;

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateX, {
        toValue: -30 * dir,
        duration: 180,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) {
        isAnimating.current = false;
        return;
      }
      setIdx(next);
      setRenderIdx(next);
      contentTranslateX.setValue(30 * dir);

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
    router.replace(ROUTES.login as any);
  }

  function handleNext() {
    if (isLast) finish();
    else goTo(idx + 1);
  }

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
              inputRange: [-10, 10],
              outputRange: [-10, 10],
            }),
          },
        ],
      };

  const shownSlide = SLIDES[renderIdx];

  return (
    <View className="flex-1 bg-white dark:bg-stone-950">
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

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
          backgroundColor: tokens.orb1,
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
          backgroundColor: tokens.orb2,
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
          backgroundColor: tokens.orb3,
          transform: [{ translateY: orb3Y }],
        }}
      />

      <View
        className="flex-1 items-center justify-center px-6"
        style={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }}
      >
        {/* Lewati */}
        <View className="absolute right-6 z-10" style={{ top: insets.top + 16 }}>
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
              backgroundColor: tokens.cardBg,
              borderRadius: 28,
              shadowColor: tokens.cardShadow,
              shadowOpacity: tokens.cardShadowOpacity,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 14 },
              elevation: 12,
            },
            { width: '100%', maxWidth: isTablet ? 560 : 420 },
            cardEntrance,
          ]}
          className="relative border border-border/40 dark:border-stone-800/60"
        >
          {/* Back */}
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

          <View className={isTablet ? 'gap-8 px-12 py-12' : 'gap-6 px-6 py-8'}>
            <SlideContent
              title={shownSlide.title}
              body={shownSlide.body}
              Illustration={shownSlide.illustration}
              isTablet={isTablet}
              illustrationSize={isTablet ? 280 : 200}
              contentStyle={contentStyle}
              illustrationFloatStyle={illustrationFloatStyle}
            />

            <SlideDots
              count={SLIDES.length}
              activeIndex={idx}
              onDotPress={goTo}
            />

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