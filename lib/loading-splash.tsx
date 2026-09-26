import { View, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/ui/text';

const LOGO = require('@/assets/images/icon.png');

export function LoadingSplash() {
  return (
    <LinearGradient
      colors={['#F9E4BC', '#FEF9ED', '#F5FAF5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ flex: 1 }}
    >
      <View className="flex-1 items-center justify-center gap-6">
        <Image
          source={LOGO}
          style={{ width: 88, height: 88 }}
          resizeMode="contain"
        />

        <View className="items-center gap-1">
          <Text className="font-dm-extrabold text-lg text-foreground">
            Latea App
          </Text>
          <Text className="font-dm-regular text-xs text-muted-foreground">
            Memuat...
          </Text>
        </View>

        <ActivityIndicator size="small" color="#008000" />
      </View>
    </LinearGradient>
  );
}