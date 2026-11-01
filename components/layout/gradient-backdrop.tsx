import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function GradientBackdrop({
  colors,
  overlayColors,
}: {
  colors: readonly [string, string, ...string[]];
  overlayColors?: readonly [string, string, ...string[]];
}) {
  return (
    <>
      <LinearGradient
        colors={colors as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {overlayColors ? (
        <LinearGradient
          colors={overlayColors as any}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
        />
      ) : null}
    </>
  );
}