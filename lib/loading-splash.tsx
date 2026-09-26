import { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  Easing,
  AccessibilityInfo,
  Dimensions,
} from 'react-native';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';

const LOGO = require('@/assets/images/icon.png');
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

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
   Loading Dots — 3 dot berdenyut bergantian
   ══════════════════════════════════════════════════════ */
function LoadingDots({
  active,
  reduceMotion,
}: {
  active: string;
  reduceMotion: boolean;
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
            width: 6,
            height: 6,
            borderRadius: 3,
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

    // Entrance sequence: logo → text → dots
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textTranslate, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous floating orbs
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
          top: -SCREEN_H * 0.1,
          right: -SCREEN_W * 0.15,
          width: SCREEN_W * 0.7,
          height: SCREEN_W * 0.7,
          borderRadius: SCREEN_W * 0.35,
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
          width: SCREEN_W * 0.75,
          height: SCREEN_W * 0.75,
          borderRadius: SCREEN_W * 0.375,
          backgroundColor: colors.orb2,
          transform: [{ translateY: orb2Y }],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: SCREEN_H * 0.4,
          left: SCREEN_W * 0.05,
          width: SCREEN_W * 0.4,
          height: SCREEN_W * 0.4,
          borderRadius: SCREEN_W * 0.2,
          backgroundColor: colors.orb3,
          transform: [{ translateY: orb3Y }],
        }}
      />

      {/* ══ Center Content ══ */}
      <View className="flex-1 items-center justify-center">
        {/* Logo dengan glow effect */}
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
            shadowColor: colors.logoShadow,
            shadowOpacity: 0.25,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
            elevation: 8,
          }}
        >
          <Image
            source={LOGO}
            style={{ width: 96, height: 96, borderRadius: 24 }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Text */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }],
            marginTop: 20,
            alignItems: 'center',
          }}
        >
          <Text className="font-dm-extrabold text-xl tracking-tight text-stone-900 dark:text-stone-50">
            Latea App
          </Text>
          <Text className="mt-1 font-dm-regular text-xs text-stone-500 dark:text-stone-400">
            Point of Sale Information System
          </Text>
        </Animated.View>

        {/* Loading dots */}
        <Animated.View style={{ opacity: dotsOpacity, marginTop: 40 }}>
          <LoadingDots active={colors.dotActive} reduceMotion={reduceMotion} />
        </Animated.View>
      </View>

      {/* ══ Footer ══ */}
      <Animated.View
        style={{
          opacity: dotsOpacity,
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Text className="font-dm-regular text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-500">
          PP. Annuqayah Latee
        </Text>
      </Animated.View>
    </LinearGradient>
  );
}