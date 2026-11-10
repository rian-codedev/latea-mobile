import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

type PreferencesState = {
  theme: ThemePreference;
  keepAwakeEnabled: boolean;
  checkoutModalEnabled: boolean;
  sessionIdleMinutes: number; // 0 = off
  _hasHydrated: boolean;

  setTheme: (theme: ThemePreference) => void;
  setKeepAwakeEnabled: (v: boolean) => void;
  setCheckoutModalEnabled: (v: boolean) => void;
  setSessionIdleMinutes: (v: number) => void;
  setHasHydrated: (v: boolean) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      keepAwakeEnabled: true,
      checkoutModalEnabled: true,
      sessionIdleMinutes: 60,
      _hasHydrated: false,

      setTheme: (theme) => set({ theme }),
      setKeepAwakeEnabled: (v) => set({ keepAwakeEnabled: v }),
      setCheckoutModalEnabled: (v) => set({ checkoutModalEnabled: v }),
      setSessionIdleMinutes: (v) => set({ sessionIdleMinutes: v }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'latea-preferences',
      version: 2, // naik dari 1 karena struktur berubah
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      /**
       * Migration dari version 1 → 2: tambah sessionIdleMinutes (default 60).
       * User lama tidak punya field ini, jadi harus diisi default.
       */
      migrate: (persisted: any, _version) => {
        if (!persisted) return persisted;
        if (typeof persisted.sessionIdleMinutes !== 'number') {
          persisted.sessionIdleMinutes = 60;
        }
        return persisted;
      },
    },
  ),
);