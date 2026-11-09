import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

type PreferencesState = {
  theme: ThemePreference;
  keepAwakeEnabled: boolean;
  checkoutModalEnabled: boolean;
  _hasHydrated: boolean;

  setTheme: (theme: ThemePreference) => void;
  setKeepAwakeEnabled: (v: boolean) => void;
  setCheckoutModalEnabled: (v: boolean) => void;
  setHasHydrated: (v: boolean) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      keepAwakeEnabled: true,
      checkoutModalEnabled: true,
      _hasHydrated: false,

      setTheme: (theme) => set({ theme }),
      setKeepAwakeEnabled: (v) => set({ keepAwakeEnabled: v }),
      setCheckoutModalEnabled: (v) => set({ checkoutModalEnabled: v }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'latea-preferences',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);