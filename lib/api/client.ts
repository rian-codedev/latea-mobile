import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '@/lib/utils/storage';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/mobile';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/* ══════════════════════════════════════════════════════
   Auth Error Handler — untuk 401 global
   ══════════════════════════════════════════════════════ */
type AuthErrorHandler = () => void;

let onAuthError: AuthErrorHandler | null = null;
let lastAuthErrorAt = 0;

/**
 * Daftarkan handler yang dipanggil saat 401 terjadi.
 * SessionProvider mendaftarkan handler ini agar bisa
 * logout otomatis + redirect ke login.
 */
export function setAuthErrorHandler(handler: AuthErrorHandler | null) {
  onAuthError = handler;
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      await tokenStorage.clear();

      // ⭐ Debounce — hindari trigger callback berkali-kali dari
      // banyak request paralel yang kena 401 bersamaan.
      const now = Date.now();
      if (now - lastAuthErrorAt > 1000) {
        lastAuthErrorAt = now;
        onAuthError?.();
      }
    }
    return Promise.reject(err);
  },
);

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorPayload | undefined;

    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (Array.isArray(first) && first.length > 0) return first[0];
    }

    if (data?.message) return data.message;
    if (error.code === 'ECONNABORTED')
      return 'Koneksi timeout. Periksa jaringan Anda.';
    if (error.message === 'Network Error')
      return 'Tidak dapat terhubung ke server. Pastikan backend aktif & IP benar.';
  }

  return 'Terjadi kesalahan. Silakan coba lagi.';
}