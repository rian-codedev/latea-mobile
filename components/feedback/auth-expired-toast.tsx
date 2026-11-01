import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut } from 'lucide-react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';

/**
 * Toast global "Sesi berakhir" — muncul saat authExpired true,
 * auto-hide 3 detik kemudian, panggil onHide untuk reset flag.
 */
export function AuthExpiredToast({
  visible,
  onHide,
  message = 'Sesi Anda telah berakhir. Silakan masuk kembali.',
}: {
  visible: boolean;
  onHide: () => void;
  message?: string;
}) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.timing(anim, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onHide();
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [visible, anim, onHide]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 12,
        left: 16,
        right: 16,
        zIndex: 999,
        elevation: 999,
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-24, 0],
            }),
          },
        ],
      }}
    >
      <View
        className="flex-row items-center gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-50 px-3.5 py-3 dark:border-amber-500/40 dark:bg-amber-950"
        style={{
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <View className="size-8 items-center justify-center rounded-full bg-amber-500/15 dark:bg-amber-500/25">
          <Icon
            as={LogOut}
            size={15}
            className="text-amber-700 dark:text-amber-400"
          />
        </View>
        <Text className="flex-1 font-dm-medium text-xs leading-4 text-amber-800 dark:text-amber-200">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}