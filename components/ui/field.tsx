import { useState, type ReactNode, type Ref } from 'react';
import { View, TextInput, TextInputProps } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import type { LucideIcon } from 'lucide-react-native';

export type FieldProps = TextInputProps & {
  label?: string;
  icon?: LucideIcon;
  right?: ReactNode;
  hasError?: boolean;
  inputRef?: Ref<TextInput>;
};

export function Field({
  label,
  icon,
  right,
  hasError,
  inputRef,
  ...inputProps
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  const borderClass = hasError
    ? 'border-destructive dark:border-red-400'
    : focused
    ? 'border-primary dark:border-sage-400'
    : 'border-border dark:border-stone-700';

  return (
    <View className="gap-1.5">
      {label ? (
        <Text className="font-dm-semibold text-xs text-foreground dark:text-stone-100">
          {label}
        </Text>
      ) : null}

      <View
        className={`h-12 flex-row items-center gap-2.5 rounded-xl border-[1.5px] bg-white px-3.5 dark:bg-stone-800 ${borderClass}`}
      >
        {icon ? (
          <Icon
            as={icon}
            size={17}
            className={
              focused
                ? 'text-primary dark:text-sage-300'
                : 'text-muted-foreground dark:text-stone-500'
            }
          />
        ) : null}
        <TextInput
          ref={inputRef}
          placeholderTextColor="#9CA3AF"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 py-0 font-dm-regular text-sm text-foreground dark:text-stone-50"
          {...inputProps}
        />
        {right}
      </View>
    </View>
  );
}