import { View, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants/app';

const LOGO = require('@/assets/images/logo.png');

export function BrandLogo() {
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