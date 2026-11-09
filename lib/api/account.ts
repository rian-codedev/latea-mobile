import axios, { AxiosError } from 'axios';
import { api } from './client';
import type { User } from '@/lib/stores/session';

export type PickedAvatar = {
  uri: string;
  name: string;
  type: string;
};

/* ══════════════════════════════════════════════════════
   Update Profil (nama + email)
   ══════════════════════════════════════════════════════ */
export async function updateProfile(input: {
  name: string;
  email: string;
  current_password?: string;
}): Promise<User> {
  const res = await api.put<{ user: User }>('/me', input);
  return res.data.user;
}

/* ══════════════════════════════════════════════════════
   Upload avatar user
   ══════════════════════════════════════════════════════ */
export async function uploadAvatar(file: PickedAvatar): Promise<User> {
  const form = new FormData();
  form.append('avatar', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  const res = await api.post<{ user: User }>('/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.user;
}

/* ══════════════════════════════════════════════════════
   Ubah password
   ══════════════════════════════════════════════════════ */
export async function updatePassword(input: {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}): Promise<void> {
  await api.put('/me/password', input);
}

/* ══════════════════════════════════════════════════════
   Update nama toko
   ══════════════════════════════════════════════════════ */
export async function updateStore(name: string): Promise<User> {
  const res = await api.put<{ user: User }>('/store', { name });
  return res.data.user;
}

/* ══════════════════════════════════════════════════════
   Upload avatar toko
   ══════════════════════════════════════════════════════ */
export async function uploadStoreAvatar(file: PickedAvatar): Promise<User> {
  const form = new FormData();
  form.append('avatar', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  const res = await api.post<{ user: User }>('/store/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.user;
}

/* ══════════════════════════════════════════════════════
   Parse field errors dari 422 Laravel response
   ══════════════════════════════════════════════════════ */
export function parseFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof AxiosError)) return {};
  const data = error.response?.data as
    | { errors?: Record<string, string[]> }
    | undefined;
  if (!data?.errors) return {};

  const result: Record<string, string> = {};
  for (const [field, messages] of Object.entries(data.errors)) {
    if (Array.isArray(messages) && messages.length > 0) {
      result[field] = String(messages[0]);
    }
  }
  return result;
}