import { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { useLoop } from '@/lib/hooks/use-loop';
import { useEntrance } from '@/lib/hooks/use-entrance';
import { welcomeGradients } from '@/lib/theme/gradients';
import { APP_NAME } from '@/lib/constants/app';
import { BrandLogo } from './brand-logo';
import { ReceiptPreview } from './receipt-preview';

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

export function LoginBanner({ reduceMotion }: { reduceMotion: boolean }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const g = welcomeGradients(isDark);

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
      Animated.timing(fade, { toValue: 0, duration: 350, useNativeDriver: true }).start(
        ({ finished }) => {
          if (!finished) return;
          setIdx((i) => (i + 1) % MESSAGES.length);
          Animated.timing(fade, {
            toValue: 1,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        },
      );
    }, 5500);
    return () => clearInterval(timer);
  }, [reduceMotion, fade]);

  const msg = MESSAGES[idx];

  return (
    <View
      className="flex-[5] justify-between overflow-hidden p-10 dark:bg-stone-950"
      style={{ minHeight: 560 }}
    >
      <LinearGradient
        colors={[...g.a]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: blend }]}>
        <LinearGradient
          colors={[...g.b]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: -90,
          right: -70,
          width: 280,
          height: 280,
          borderRadius: 140,
          backgroundColor: isDark ? 'rgba(132,169,140,0.06)' : 'rgba(255,255,255,0.5)',
          transform: [
            { translateX: drift1.interpolate({ inputRange: [0, 1], outputRange: [0, -28] }) },
            { translateY: drift1.interpolate({ inputRange: [0, 1], outputRange: [0, 22] }) },
          ],
        }}
      />
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -80,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: isDark ? 'rgba(120,165,140,0.08)' : 'rgba(120,165,140,0.16)',
          transform: [
            { translateX: drift2.interpolate({ inputRange: [0, 1], outputRange: [0, 24] }) },
            { translateY: drift2.interpolate({ inputRange: [0, 1], outputRange: [0, -18] }) },
          ],
        }}
      />

      <Animated.View style={logoIn}>
        <BrandLogo />
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