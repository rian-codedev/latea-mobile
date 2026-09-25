import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'latea_has_launched';

export function useFirstLaunch() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const value = await AsyncStorage.getItem(KEY);
        if (mounted) setIsFirstLaunch(value === null);
      } catch {
        if (mounted) setIsFirstLaunch(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function markLaunched() {
    await AsyncStorage.setItem(KEY, 'true');
    setIsFirstLaunch(false);
  }

  return { isFirstLaunch, markLaunched };
}