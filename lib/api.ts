import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './storage';

/**
 * ⚠️ Ganti IP ini dengan IP LAN komputer Laravel Anda.
 *    Cari via: ipconfig (Windows) / ifconfig (Mac/Linux).
 */
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.100.102:8000/api/mobile';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — otomatis inject token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto-clear token saat 401
api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status === 401) {
      await tokenStorage.clear();
    }
    return Promise.reject(err);
  }
);

/** Ekstrak pesan error dari Laravel agar ramah user */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;

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