import { Switch } from 'react-native';

export function SettingsSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#D1D5DB', true: '#84A98C' }}
      thumbColor="#FFFFFF"
      ios_backgroundColor="#D1D5DB"
    />
  );
}