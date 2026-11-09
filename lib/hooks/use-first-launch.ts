import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'latea_has_launched';

type FirstLaunchState = {
  /** null = belum hydrate; true = first launch; false = bukan */
  isFirstLaunch: boolean | null;
  setFirstLaunch: (v: boolean | null) => void;
};

const useFirstLaunchStore = create<FirstLaunchState>((set) => ({
  isFirstLaunch: null,
  setFirstLaunch: (v) => set({ isFirstLaunch: v }),
}));

/* ⭐ Hydrate sekali saat module load */
AsyncStorage.getItem(KEY)
  .then((value) => {
    useFirstLaunchStore.getState().setFirstLaunch(value === null);
  })
  .catch(() => {
    useFirstLaunchStore.getState().setFirstLaunch(false);
  });

export function useFirstLaunch() {
  const isFirstLaunch = useFirstLaunchStore((s) => s.isFirstLaunch);
  const setFirstLaunch = useFirstLaunchStore((s) => s.setFirstLaunch);

  async function markLaunched() {
    try {
      await AsyncStorage.setItem(KEY, 'true');
    } finally {
      setFirstLaunch(false);
    }
  }

  return { isFirstLaunch, markLaunched };
}