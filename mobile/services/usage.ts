import * as SecureStore from 'expo-secure-store';

export const FREE_DAILY_LIMIT = 5;

interface UsageData {
  date: string; // YYYY-MM-DD
  count: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadUsage(): Promise<UsageData> {
  try {
    const raw = await SecureStore.getItemAsync('usage_v1');
    if (!raw) return { date: todayStr(), count: 0 };
    const data: UsageData = JSON.parse(raw);
    if (data.date !== todayStr()) return { date: todayStr(), count: 0 };
    return data;
  } catch {
    return { date: todayStr(), count: 0 };
  }
}

export async function getUsageCount(): Promise<number> {
  return (await loadUsage()).count;
}

export async function incrementUsage(): Promise<number> {
  const data = await loadUsage();
  const updated = { date: todayStr(), count: data.count + 1 };
  await SecureStore.setItemAsync('usage_v1', JSON.stringify(updated));
  return updated.count;
}

export async function canGenerate(): Promise<boolean> {
  return (await getUsageCount()) < FREE_DAILY_LIMIT;
}
