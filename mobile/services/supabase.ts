import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store has a practical limit per key.
// Split large values (like Supabase sessions) into chunks.
const CHUNK = 1800;

const storage = {
  async getItem(key: string): Promise<string | null> {
    const n = await SecureStore.getItemAsync(`${key}__n`);
    if (!n) return SecureStore.getItemAsync(key);
    const parts = await Promise.all(
      Array.from({ length: +n }, (_, i) => SecureStore.getItemAsync(`${key}__${i}`)),
    );
    return parts.some((p) => p === null) ? null : parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const n = Math.ceil(value.length / CHUNK);
    await SecureStore.setItemAsync(`${key}__n`, String(n));
    await Promise.all(
      Array.from({ length: n }, (_, i) =>
        SecureStore.setItemAsync(`${key}__${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK)),
      ),
    );
  },
  async removeItem(key: string): Promise<void> {
    const n = await SecureStore.getItemAsync(`${key}__n`);
    if (n) {
      await Promise.all([
        SecureStore.deleteItemAsync(`${key}__n`),
        ...Array.from({ length: +n }, (_, i) => SecureStore.deleteItemAsync(`${key}__${i}`)),
      ]);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  },
);
