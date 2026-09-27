import { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Image,
  Animated,
  Easing,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';

const LOGO = require('@/assets/images/icon.png');

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
    dotActive: '#84A98C',
    dotInactive: 'rgba(132,169,140,0.25)',
    logoShadow: '#84A98C',
  },
  dark: {
    gradient: ['#1A1612', '#0F0E0B', '#0D1410'] as const,
    orb1: 'rgba(132,169,140,0.10)',
    orb2: 'rgba(200,180,120,0.06)',
    orb3: 'rgba(132,169,140,0.05)',
    dotActive: '#84A98C',
    dotInactive: 'rgba(132,169,140,0.20)',
    logoShadow: '#000000',
  },
} as const;

/* ══════════════════════════════════════════════════════
   Reduce Motion Hook
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

/* ══════════════════════════════════════════════════════
   Responsive sizing hook
   ══════════════════════════════════════════════════════ */
function useResponsiveSizes(width: number, height: number) {
  return useMemo(() => {
    const isTablet = width >= 768;
    const isLandscape = width > height;
    const isSmall = width < 360;

    /* ── Logo ── */
    // Tablet 400, handphone 80
    // Tapi kalau tablet landscape (tinggi sempit), kecilkan proporsional
    const logoSize = isTablet
      ? Math.min(400, height * 0.45)
      : Math.min(200, height * 0.50);

    /* ── Text sizes ── */
    // Scale proporsional dengan logo
    const titleSize = isTablet ? 32 : isSmall ? 16 : 18;
    const subtitleSize = isTablet ? 16 : isSmall ? 11 : 12;
    const footerSize = isTablet ? 12 : isSmall ? 9 : 10;

    /* ── Spacing ── */
    // Semua di-scale naik untuk tablet karena logo jauh lebih besar
    const textMarginTop = isTablet ? 40 : 20;
    const dotsMarginTop = isTablet ? 64 : 36;
    const footerBottom = isTablet ? 60 : 40;

    /* ── Dot size ── */
    const dotSize = isTablet ? 10 : 6;

    /* ── Orb sizes ── */
    // Tablet: orb lebih besar biar seimbang dengan logo
    const orb1Size = isTablet
      ? Math.min(width * 0.65, 650)
      : Math.min(width * 0.7, 420);
    const orb2Size = isTablet
      ? Math.min(width * 0.7, 700)
      : Math.min(width * 0.75, 450);
    const orb3Size = isTablet
      ? Math.min(width * 0.4, 400)
      : Math.min(width * 0.4, 240);

    return {
      isTablet,
      isLandscape,
      isSmall,
      logoSize,
      titleSize,
      subtitleSize,
      footerSize,
      textMarginTop,
      dotsMarginTop,
      footerBottom,
      dotSize,
      orb1Size,
      orb2Size,
      orb3Size,
    };
  }, [width, height]);
}

/* ══════════════════════════════════════════════════════
   Loading Dots
   ══════════════════════════════════════════════════════ */
function LoadingDots({
  active,
  reduceMotion,
  size = 6,
}: {
  active: string;
  reduceMotion: boolean;
  size?: number;
}) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    if (reduceMotion) {
      dots.forEach((d) => d.setValue(1));
      return;
    }

    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 200),
        ])
      )
    );

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [reduceMotion]);

  return (
    <View className="flex-row items-center gap-2">
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: active,
            opacity: dot,
            transform: [
              {
                scale: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1.2],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

/* ══════════════════════════════════════════════════════
   Loading Splash
   ══════════════════════════════════════════════════════ */
export function LoadingSplash() {
  const { colorScheme } = useColorScheme();
  const theme: Theme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = THEME[theme];
  const reduceMotion = useReduceMotion();

  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const sizes = useResponsiveSizes(SCREEN_W, SCREEN_H);

  /* ── Entrance animations ── */
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(12)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  /* ── Floating orbs ── */
  const orb1Y = useRef(new Animated.Value(0)).current;
  const orb2Y = useRef(new Animated.Value(0)).current;
  const orb3Y = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      logoOpacity.setValue(1);
      logoScale.setValue(1);
      textOpacity.setValue(1);
      textTranslate.setValue(0);
      dotsOpacity.setValue(1);
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 7,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

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

    o1.start();
    o2.start();
    o3.start();

    return () => {
      o1.stop();
      o2.stop();
      o3.stop();
    };
  }, [reduceMotion]);

  return (
    <LinearGradient
      colors={[...colors.gradient]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* ══ Background Orbs ══ */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -SCREEN_H * 0.08,
          right: -SCREEN_W * 0.15,
          width: sizes.orb1Size,
          height: sizes.orb1Size,
          borderRadius: sizes.orb1Size / 2,
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
          width: sizes.orb2Size,
          height: sizes.orb2Size,
          borderRadius: sizes.orb2Size / 2,
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
          width: sizes.orb3Size,
          height: sizes.orb3Size,
          borderRadius: sizes.orb3Size / 2,
          backgroundColor: colors.orb3,
          transform: [{ translateY: orb3Y }],
        }}
      />

      {/* ══ Center Content ══ */}
      <View
        className="flex-1 items-center justify-center px-6"
        style={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {/* Logo dengan glow effect */}
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
            shadowColor: colors.logoShadow,
            shadowOpacity: 0.25,
            shadowRadius: sizes.isTablet ? 40 : 24,
            shadowOffset: {
              width: 0,
              height: sizes.isTablet ? 20 : 12,
            },
            elevation: 8,
          }}
        >
          <Image
            source={LOGO}
            style={{
              width: sizes.logoSize,
              height: sizes.logoSize,
              borderRadius: sizes.logoSize * 0.22,
            }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }],
            marginTop: sizes.textMarginTop,
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Text
            className="font-dm-extrabold tracking-tight text-stone-900 dark:text-stone-50"
            style={{
              fontSize: sizes.titleSize,
              lineHeight: sizes.titleSize * 1.25,
            }}
          >
            Latea App
          </Text>
          <Text
            className="text-center font-dm-regular text-stone-500 dark:text-stone-400"
            style={{
              fontSize: sizes.subtitleSize,
              lineHeight: sizes.subtitleSize * 1.4,
              marginTop: 6,
            }}
            numberOfLines={1}
          >
            Point of Sale Information System
          </Text>
        </Animated.View>

        {/* Loading dots */}
        <Animated.View
          style={{ opacity: dotsOpacity, marginTop: sizes.dotsMarginTop }}
        >
          <LoadingDots
            active={colors.dotActive}
            reduceMotion={reduceMotion}
            size={sizes.dotSize}
          />
        </Animated.View>
      </View>

      {/* ══ Footer ══ */}
      <Animated.View
        style={{
          opacity: dotsOpacity,
          position: 'absolute',
          bottom: Math.max(insets.bottom, 16) + sizes.footerBottom - 40,
          left: 0,
          right: 0,
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Text
          className="text-center font-dm-regular uppercase tracking-widest text-stone-400 dark:text-stone-500"
          style={{ fontSize: sizes.footerSize }}
          numberOfLines={1}
        >
          PP. Annuqayah Latee
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}