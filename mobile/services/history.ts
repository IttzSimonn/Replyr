export interface HistoryItem {
  id: string;
  timestamp: string;
  platform: string;
  intent: string;
  target: string;
  dm1: string;
  dm2: string;
  dm3: string;
}

let _items: HistoryItem[] = [];

export function addToHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
  _items.unshift({
    ...item,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  });
  if (_items.length > 100) _items.length = 100;
}

export function getHistory(): HistoryItem[] {
  return _items;
}

export function removeFromHistory(id: string): void {
  _items = _items.filter((item) => item.id !== id);
}

export function clearHistory(): void {
  _items = [];
}
