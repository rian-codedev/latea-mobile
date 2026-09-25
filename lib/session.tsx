import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { tokenStorage } from './storage';

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  store_id: number | null;
  store: {
    id: number;
    name: string;
    code: string;
    location: string;
  } | null;
};

type SessionState = {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = React.createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const queryClient = useQueryClient();

  // Restore session saat app pertama dibuka
  React.useEffect(() => {
  let mounted = true;

  (async () => {
    const token = await tokenStorage.get();

    if (token) {
      try {
        const res = await api.get<User>('/me');
        if (mounted) setUser(res.data);
      } catch (err: any) {
        await tokenStorage.clear();
      }
    } else {
    }

    if (mounted) setIsLoading(false);
  })();

  return () => {
    mounted = false;
  };
}, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/login', {
      email,
      password,
    });
    await tokenStorage.set(res.data.token);
    queryClient.clear();
    setUser(res.data.user);
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // Abaikan — tetap bersihkan lokal
    } finally {
      await tokenStorage.clear();
      queryClient.clear();
      setUser(null);
    }
  }, []);

  const value = React.useMemo(
    () => ({ user, isLoading, signIn, signOut }),
    [user, isLoading, signIn, signOut]
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return ctx;
}