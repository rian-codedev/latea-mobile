import { memo } from 'react';
import { View, Animated } from 'react-native';
import { Text } from '@/components/ui/text';

const MemoIllustration = memo(
  function MemoIllustration({
    Component,
    size,
  }: {
    Component: React.ComponentType<any>;
    size: number;
  }) {
    return (
      <View style={{ width: size, height: size }} className="items-center justify-center">
        <Component width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
      </View>
    );
  },
  (prev, next) => prev.Component === next.Component && prev.size === next.size,
);

export function SlideContent({
  title,
  body,
  Illustration,
  isTablet,
  illustrationSize,
  contentStyle,
  illustrationFloatStyle,
}: {
  title: string;
  body: string;
  Illustration: React.ComponentType<any>;
  isTablet: boolean;
  illustrationSize: number;
  contentStyle: any;
  illustrationFloatStyle: any;
}) {
  return (
    <Animated.View
      style={[contentStyle, { minHeight: isTablet ? 420 : 340 }]}
      className="items-center justify-center gap-6"
    >
      <Animated.View style={illustrationFloatStyle} className="items-center justify-center">
        <MemoIllustration Component={Illustration} size={illustrationSize} />
      </Animated.View>

      <View className="items-center gap-2.5">
        <Text
          className={`text-center font-dm-extrabold tracking-tight text-foreground dark:text-stone-50 ${
            isTablet ? 'text-3xl' : 'text-2xl'
          }`}
        >
          {title}
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
              isTablet ? 'max-w-[380px] text-base' : 'max-w-[280px] text-sm'
            }`}
            numberOfLines={3}
          >
            {body}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}