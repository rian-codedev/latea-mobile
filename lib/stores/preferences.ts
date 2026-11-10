import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

type PreferencesState = {
  theme: ThemePreference;
  keepAwakeEnabled: boolean;
  checkoutModalEnabled: boolean;
  sessionIdleMinutes: number;
  voiceEnabled: boolean;
  voiceIdleSeconds: number;
  ttsEnabled: boolean;
  _hasHydrated: boolean;

  setTheme: (theme: ThemePreference) => void;
  setKeepAwakeEnabled: (v: boolean) => void;
  setCheckoutModalEnabled: (v: boolean) => void;
  setSessionIdleMinutes: (v: number) => void;
  setVoiceEnabled: (v: boolean) => void;
  setVoiceIdleSeconds: (v: number) => void;
  setTtsEnabled: (v: boolean) => void;
  setHasHydrated: (v: boolean) => void;
};

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      keepAwakeEnabled: true,
      checkoutModalEnabled: true,
      sessionIdleMinutes: 60,
      voiceEnabled: false,
      voiceIdleSeconds: 120,
      ttsEnabled: true,
      _hasHydrated: false,

      setTheme: (theme) => set({ theme }),
      setKeepAwakeEnabled: (v) => set({ keepAwakeEnabled: v }),
      setCheckoutModalEnabled: (v) => set({ checkoutModalEnabled: v }),
      setSessionIdleMinutes: (v) => set({ sessionIdleMinutes: v }),
      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setVoiceIdleSeconds: (v) => set({ voiceIdleSeconds: v }),
      setTtsEnabled: (v) => set({ ttsEnabled: v }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'latea-preferences',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      migrate: (persisted: any, _version) => {
        if (!persisted) return persisted;

        // v1 → v2
        if (typeof persisted.sessionIdleMinutes !== 'number') {
          persisted.sessionIdleMinutes = 60;
        }
        // v2 → v3
        if (typeof persisted.voiceEnabled !== 'boolean') {
          persisted.voiceEnabled = false;
        }
        if (typeof persisted.voiceIdleSeconds !== 'number') {
          persisted.voiceIdleSeconds = 120;
        }
        if (typeof persisted.ttsEnabled !== 'boolean') {
          persisted.ttsEnabled = true;
        }
        return persisted;
      },
    },
  ),
);