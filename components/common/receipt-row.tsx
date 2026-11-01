import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export function ReceiptRow({
  label,
  value,
  bold,
  primary,
  destructive,
}: {
  label: string;
  value: string;
  bold?: boolean;
  primary?: boolean;
  destructive?: boolean;
}) {
  return (
    <View className="w-full flex-row items-center justify-between gap-3">
      <Text
        className={`shrink-0 font-dm-regular text-muted-foreground dark:text-stone-400 ${
          bold ? 'text-sm' : 'text-[11px]'
        }`}
      >
        {label}
      </Text>
      <View className="min-w-0 flex-1 items-end">
        <Text
          className={`${
            bold ? 'font-dm-extrabold text-lg' : 'font-dm-semibold text-[12px]'
          } ${
            primary
              ? 'text-primary dark:text-sage-400'
              : destructive
                ? 'text-destructive dark:text-red-400'
                : 'text-foreground dark:text-stone-50'
          }`}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      </View>
    </View>
  );
}