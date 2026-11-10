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
  voiceNoSpeechDelaySeconds: number;
  ttsEnabled: boolean;
  ttsVoiceId: string | null;      // ⭐ NEW
  ttsRate: number;                // ⭐ NEW
  _hasHydrated: boolean;

  setTheme: (theme: ThemePreference) => void;
  setKeepAwakeEnabled: (v: boolean) => void;
  setCheckoutModalEnabled: (v: boolean) => void;
  setSessionIdleMinutes: (v: number) => void;
  setVoiceEnabled: (v: boolean) => void;
  setVoiceIdleSeconds: (v: number) => void;
  setVoiceNoSpeechDelaySeconds: (v: number) => void;
  setTtsEnabled: (v: boolean) => void;
  setTtsVoiceId: (v: string | null) => void;   // ⭐ NEW
  setTtsRate: (v: number) => void;             // ⭐ NEW
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
      voiceNoSpeechDelaySeconds: 3,
      ttsEnabled: true,
      ttsVoiceId: null,       // ⭐ null = pakai default system
      ttsRate: 1.0,           // ⭐ normal
      _hasHydrated: false,

      setTheme: (theme) => set({ theme }),
      setKeepAwakeEnabled: (v) => set({ keepAwakeEnabled: v }),
      setCheckoutModalEnabled: (v) => set({ checkoutModalEnabled: v }),
      setSessionIdleMinutes: (v) => set({ sessionIdleMinutes: v }),
      setVoiceEnabled: (v) => set({ voiceEnabled: v }),
      setVoiceIdleSeconds: (v) => set({ voiceIdleSeconds: v }),
      setVoiceNoSpeechDelaySeconds: (v) =>
        set({ voiceNoSpeechDelaySeconds: v }),
      setTtsEnabled: (v) => set({ ttsEnabled: v }),
      setTtsVoiceId: (v) => set({ ttsVoiceId: v }),
      setTtsRate: (v) => set({ ttsRate: v }),
      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: 'latea-preferences',
      version: 5,
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
        // v3 → v4
        if (typeof persisted.voiceNoSpeechDelaySeconds !== 'number') {
          persisted.voiceNoSpeechDelaySeconds = 3;
        }
        // v4 → v5
        if (typeof persisted.ttsRate !== 'number') {
          persisted.ttsRate = 1.0;
        }
        if (!('ttsVoiceId' in persisted)) {
          persisted.ttsVoiceId = null;
        }
        return persisted;
      },
    },
  ),
);