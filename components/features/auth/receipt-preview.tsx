import { View, Animated } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatRupiah } from '@/lib/utils/format';
import { APP_TAGLINE } from '@/lib/constants/app';
import { useEntrance } from '@/lib/hooks/use-entrance';
import { DashedLine } from '@/components/common/dashed-line';

const SAMPLE_LINES = [
  { emoji: '🧋', name: 'Es Teh Manis', qty: 3, price: 8000 },
  { emoji: '☕', name: 'Kopi Susu', qty: 2, price: 18000 },
  { emoji: '🥐', name: 'Roti Bakar', qty: 1, price: 22000 },
];

export function ReceiptPreview({ reduceMotion }: { reduceMotion: boolean }) {
  const total = SAMPLE_LINES.reduce((a, l) => a + l.qty * l.price, 0);

  return (
    <View
      className="w-[300px] rounded-2xl bg-white p-5 dark:bg-stone-800"
      style={{
        shadowColor: '#0F172A',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
      }}
      pointerEvents="none"
    >
      <View className="mb-3 flex-row items-center justify-between">
        <View>
          <Text className="font-dm-bold text-xs text-foreground dark:text-stone-50">
            {APP_TAGLINE}
          </Text>
          <Text className="font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
            Struk #0042
          </Text>
        </View>
        <Text className="font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
          Contoh
        </Text>
      </View>

      <DashedLine count={30} width={5} />

      <View className="gap-2.5 py-3">
        {SAMPLE_LINES.map((l, i) => (
          <AnimatedReceiptRow
            key={l.name}
            line={l}
            delay={1000 + i * 220}
            reduceMotion={reduceMotion}
          />
        ))}
      </View>

      <DashedLine count={30} width={5} />

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="font-dm-bold text-xs text-foreground dark:text-stone-50">TOTAL</Text>
        <Text className="font-dm-extrabold text-lg leading-none tracking-tight text-primary dark:text-sage-300">
          {formatRupiah(total)}
        </Text>
      </View>
    </View>
  );
}

function AnimatedReceiptRow({
  line,
  delay,
  reduceMotion,
}: {
  line: (typeof SAMPLE_LINES)[number];
  delay: number;
  reduceMotion: boolean;
}) {
  const style = useEntrance(delay, reduceMotion, 8);
  return (
    <Animated.View style={[style, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
      <View className="size-7 items-center justify-center rounded-md bg-accent/60 dark:bg-stone-700">
        <Text className="text-sm">{line.emoji}</Text>
      </View>
      <View className="flex-1">
        <Text
          className="font-dm-semibold text-[11px] text-foreground dark:text-stone-50"
          numberOfLines={1}
        >
          {line.name}
        </Text>
        <Text className="font-dm-regular text-[10px] text-muted-foreground dark:text-stone-400">
          {line.qty} × {formatRupiah(line.price)}
        </Text>
      </View>
      <Text className="font-dm-bold text-[11px] text-foreground dark:text-stone-50">
        {formatRupiah(line.qty * line.price)}
      </Text>
    </Animated.View>
  );
}