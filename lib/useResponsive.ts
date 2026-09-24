import { useWindowDimensions, Platform } from 'react-native';

/**
 * Deteksi perangkat lebih akurat dari sekadar width.
 * - Tablet Android: biasanya >= 600dp
 * - iPad: selalu tablet
 * - Landscape: apapun yang lebar > tinggi bisa dianggap tablet-like
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  // iPad selalu terdeteksi tablet (via Platform)
  const isIPad = Platform.OS === 'ios' && Platform.isPad === true;

  // Tablet Android: pakai 600dp sebagai ambang
  const isTabletByWidth = width >= 600;

  // Landscape (lebar > tinggi) — biasanya tablet
  const isLandscape = width > height;

  const isTablet = isIPad || isTabletByWidth || (isLandscape && width >= 500);

  // Grid kolom produk
  const cols = width >= 1024 ? 6 : isTablet ? 5 : 4;

  return {
    width,
    height,
    isTablet,
    isLandscape,
    cols,
  };
}