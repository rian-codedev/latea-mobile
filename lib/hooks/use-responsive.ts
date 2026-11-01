import { useWindowDimensions, Platform } from 'react-native';

export type DeviceClass = 'phone' | 'tablet' | 'tablet-large';

export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isIPad = Platform.OS === 'ios' && Platform.isPad === true;
  const isTabletByWidth = width >= 600;
  const isLandscape = width > height;
  const isTablet = isIPad || isTabletByWidth || (isLandscape && width >= 500);

  const device: DeviceClass =
    width >= 1024 ? 'tablet-large' : isTablet ? 'tablet' : 'phone';

  /** Layout dua kolom di dashboard — lebah dari ambang tablet besar */
  const isWide = width >= 900;

  return { width, height, isTablet, isLandscape, device, isWide };
}

/* Preset grid yang eksplisit */
export function getGridColumns(
  device: DeviceClass,
  mode: 'catalog' | 'cart' = 'catalog',
): number {
  if (mode === 'cart') return 1;
  return device === 'tablet-large' ? 4 : device === 'tablet' ? 3 : 2;
}