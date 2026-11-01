import * as React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { api, setAuthErrorHandler } from '@/lib/api/client';
import { tokenStorage } from '@/lib/utils/storage';

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  store_id: number | null;
  store: { id: number; name: string; code: string; location: string } | null;
  avatar_url?: string | null;
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

  /* ── Restore session saat app pertama dibuka ── */
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await tokenStorage.get();
      if (token) {
        try {
          const res = await api.get<User>('/me');
          if (mounted) setUser(res.data);
        } catch {
          await tokenStorage.clear();
        }
      }
      if (mounted) setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ⭐ 401 dari axios → auto-logout + clear cache */
  React.useEffect(() => {
    setAuthErrorHandler(() => {
      queryClient.clear();
      setUser(null);
    });
    return () => setAuthErrorHandler(null);
  }, [queryClient]);

  /* ⭐ Re-validate saat app kembali ke foreground */
  React.useEffect(() => {
    if (!user) return;

    const sub = AppState.addEventListener(
      'change',
      async (state: AppStateStatus) => {
        if (state !== 'active') return;

        try {
          const token = await tokenStorage.get();
          if (!token) {
            setUser(null);
            queryClient.clear();
            return;
          }
          const res = await api.get<User>('/me');
          setUser(res.data);
        } catch (err: any) {
          if (err?.response?.status === 401) {
            await tokenStorage.clear();
            queryClient.clear();
            setUser(null);
          }
          // Error non-401 (network, timeout) → diamkan, biarkan user retry
        }
      },
    );
    return () => sub.remove();
  }, [user, queryClient]);

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ token: string; user: User }>('/login', {
        email,
        password,
      });
      await tokenStorage.set(res.data.token);
      queryClient.clear();
      setUser(res.data.user);
    },
    [queryClient],
  );

  const signOut = React.useCallback(async () => {
    try {
      await api.post('/logout');
    } catch {
      // diamkan — tetap bersihkan lokal
    } finally {
      await tokenStorage.clear();
      queryClient.clear();
      setUser(null);
    }
  }, [queryClient]);

  const value = React.useMemo(
    () => ({ user, isLoading, signIn, signOut }),
    [user, isLoading, signIn, signOut],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}