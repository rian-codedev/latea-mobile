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
  authExpired: boolean;
  clearAuthExpired: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = React.createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authExpired, setAuthExpired] = React.useState(false);
  const queryClient = useQueryClient();

  /* ⭐ Reset terpusat — dipakai di semua jalur auth failure */
  const resetSession = React.useCallback(
    (expired: boolean) => {
      queryClient.clear();
      setUser(null);
      if (expired) setAuthExpired(true);
    },
    [queryClient],
  );

  /* ── Restore session saat app start ── */
  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const token = await tokenStorage.get();
      if (!token) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        // ⭐ FIX: /me return { user: {...} }, bukan user langsung
        const res = await api.get<{ user: User }>('/me');
        if (mounted) setUser(res.data.user);
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 401) {
          await tokenStorage.clear();
          if (mounted) setAuthExpired(true);
        }
        // Network error (bukan 401) → biarkan token, user null
        // (login screen akan muncul; token akan diganti saat signIn)
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  /* ── 401 global dari axios → auto-logout + toast ── */
  React.useEffect(() => {
    setAuthErrorHandler(() => {
      resetSession(true);
    });
    return () => setAuthErrorHandler(null);
  }, [resetSession]);

  /* ── Re-validate saat app kembali ke foreground ── */
  React.useEffect(() => {
    if (!user) return;

    const sub = AppState.addEventListener(
      'change',
      async (state: AppStateStatus) => {
        if (state !== 'active') return;

        try {
          const token = await tokenStorage.get();
          if (!token) {
            resetSession(true);
            return;
          }
          // ⭐ FIX: parsing benar
          const res = await api.get<{ user: User }>('/me');
          setUser(res.data.user);
        } catch (err: any) {
          if (err?.response?.status === 401) {
            await tokenStorage.clear();
            resetSession(true);
          }
          // Network error saat resume → jangan logout paksa
        }
      },
    );

    return () => sub.remove();
  }, [user, resetSession]);

  const clearAuthExpired = React.useCallback(() => {
    setAuthExpired(false);
  }, []);

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ token: string; user: User }>('/login', {
        email,
        password,
      });
      await tokenStorage.set(res.data.token);
      queryClient.clear();
      setAuthExpired(false);
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
      setAuthExpired(false); // logout manual ≠ sesi habis
      setUser(null);
    }
  }, [queryClient]);

  const value = React.useMemo(
    () => ({
      user,
      isLoading,
      authExpired,
      clearAuthExpired,
      signIn,
      signOut,
    }),
    [user, isLoading, authExpired, clearAuthExpired, signIn, signOut],
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