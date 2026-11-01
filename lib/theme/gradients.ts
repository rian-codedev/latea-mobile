/* ══════════════════════════════════════════════════════
   Soft Gradients — dipakai Cashier & tombol floating
   ══════════════════════════════════════════════════════ */
export const SOFT_GRADIENT_A      = ['#EEF5F0', '#DCEBE1', '#CBDFD3'] as const;
export const SOFT_GRADIENT_B      = ['#E9F1F4', '#D8E6EC', '#E4EEE7'] as const;
export const SOFT_GRADIENT_A_DARK = ['#1C2A22', '#182A20', '#15251D'] as const;
export const SOFT_GRADIENT_B_DARK = ['#152225', '#182A2A', '#1A2D24'] as const;

/* ══════════════════════════════════════════════════════
   Welcome Gradients — dipakai Dashboard StartCard & Login Banner
   ══════════════════════════════════════════════════════ */
export const WELCOME_GRADIENT_A      = ['#EEF5F0', '#DCEBE1', '#CBDFD3'] as const;
export const WELCOME_GRADIENT_B      = ['#E9F1F4', '#D8E6EC', '#E4EEE7'] as const;
export const WELCOME_GRADIENT_A_DARK = ['#0F1F17', '#0A1712', '#071210'] as const;
export const WELCOME_GRADIENT_B_DARK = ['#0A1418', '#091418', '#0A1712'] as const;

/* ══════════════════════════════════════════════════════
   Warm Backdrop — dipakai Onboarding & Loading Splash
   ══════════════════════════════════════════════════════ */
export const WARM_GRADIENT = {
  light: ['#F9E4BC', '#FEF9ED', '#F5FAF5'] as const,
  dark:  ['#1A1612', '#0F0E0B', '#0D1410'] as const,
} as const;

/* ══════════════════════════════════════════════════════
   Helper: pilih token berdasarkan mode gelap
   ══════════════════════════════════════════════════════ */
export function softGradients(isDark: boolean) {
  return {
    a: isDark ? SOFT_GRADIENT_A_DARK : SOFT_GRADIENT_A,
    b: isDark ? SOFT_GRADIENT_B_DARK : SOFT_GRADIENT_B,
  };
}

export function welcomeGradients(isDark: boolean) {
  return {
    a: isDark ? WELCOME_GRADIENT_A_DARK : WELCOME_GRADIENT_A,
    b: isDark ? WELCOME_GRADIENT_B_DARK : WELCOME_GRADIENT_B,
  };
}

export function warmGradient(isDark: boolean) {
  return isDark ? WARM_GRADIENT.dark : WARM_GRADIENT.light;
}