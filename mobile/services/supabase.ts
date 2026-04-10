import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import {
  getRandomValues,
  digestStringAsync,
  CryptoDigestAlgorithm,
  CryptoEncoding,
} from 'expo-crypto';

// ─── WebCrypto polyfill ───────────────────────────────────────────────────────
// React Native (incl. Expo Go) doesn't expose global.crypto.subtle, which
// Supabase needs for PKCE SHA-256 code challenges. Polyfill it with expo-crypto.
function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

if (typeof global.crypto === 'undefined' || !(global.crypto as any).subtle) {
  (global as any).crypto = {
    getRandomValues,
    subtle: {
      digest: async (algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer> => {
        // Convert ArrayBuffer back to the original ASCII string (PKCE verifier is base64url)
        const bytes = new Uint8Array(data);
        const str = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
        const algMap: Record<string, CryptoDigestAlgorithm> = {
          'SHA-1': CryptoDigestAlgorithm.SHA1,
          'SHA-256': CryptoDigestAlgorithm.SHA256,
          'SHA-512': CryptoDigestAlgorithm.SHA512,
        };
        const alg = algMap[algorithm] ?? CryptoDigestAlgorithm.SHA256;
        const hex = await digestStringAsync(alg, str, { encoding: CryptoEncoding.HEX });
        return hexToBuffer(hex);
      },
    },
  };
}
// ─────────────────────────────────────────────────────────────────────────────

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
