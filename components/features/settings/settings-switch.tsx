import { Switch } from 'react-native';

export function SettingsSwitch({
  value,
  onValueChange,
  disabled = false,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: '#D1D5DB', true: '#84A98C' }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#D1D5DB"
    />
  );
}