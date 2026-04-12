import * as SecureStore from 'expo-secure-store';

// 3 lifetime free generations — no daily reset
export const FREE_TOTAL_LIMIT = 3;
const USAGE_KEY = 'usage_lifetime_v1';

export async function getUsageCount(): Promise<number> {
  try {
    const raw = await SecureStore.getItemAsync(USAGE_KEY);
    if (!raw) return 0;
    return parseInt(raw, 10) || 0;
  } catch {
    return 0;
  }
}

export async function incrementUsage(): Promise<number> {
  const count = await getUsageCount();
  const updated = count + 1;
  await SecureStore.setItemAsync(USAGE_KEY, String(updated));
  return updated;
}

export async function canGenerate(): Promise<boolean> {
  return (await getUsageCount()) < FREE_TOTAL_LIMIT;
}
