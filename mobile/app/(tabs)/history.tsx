import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { getHistory, removeFromHistory, clearHistory, HistoryItem } from '../../services/history';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const PLATFORM_COLOR: Record<string, string> = {
  Instagram: '#E1306C',
  LinkedIn: '#0A66C2',
  WhatsApp: '#25D366',
  Email: '#6366F1',
  'Twitter/X': '#000000',
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setItems([...getHistory()]);
    }, []),
  );

  const handleDelete = (id: string) => {
    Alert.alert('Remove', 'Delete this DM from history?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeFromHistory(id);
          setItems([...getHistory()]);
        },
      },
    ]);
  };

  const handleClear = () => {
    Alert.alert('Clear History', 'Remove all generated DMs?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => {
          clearHistory();
          setItems([]);
        },
      },
    ]);
  };

  const handleCopy = async (text: string, id: string) => {
    await Clipboard.setStringAsync(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.title}>History</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No DMs yet</Text>
          <Text style={styles.emptySubtitle}>
            Your generated messages will appear here after your first generation.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>History</Text>
        <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
          <Text style={styles.clearBtn}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const isOpen = expanded === item.id;
          const platformColor = PLATFORM_COLOR[item.platform] ?? '#7B61FF';

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => setExpanded(isOpen ? null : item.id)}
              activeOpacity={0.8}
            >
              {/* Card header */}
              <View style={styles.cardTop}>
                <View style={styles.cardMeta}>
                  <View style={[styles.platformDot, { backgroundColor: platformColor }]} />
                  <Text style={styles.platform}>{item.platform}</Text>
                  <Text style={styles.intent}>{item.intent}</Text>
                </View>
                <Text style={styles.time}>{timeAgo(item.timestamp)}</Text>
              </View>

              <Text style={styles.target} numberOfLines={1}>To: {item.target}</Text>

              {/* Expanded DMs */}
              {isOpen && (
                <View style={styles.dmsWrap}>
                  {[item.dm1, item.dm2, item.dm3].map((dm, i) => (
                    <View key={i} style={styles.dmRow}>
                      <Text style={styles.dmLabel}>DM {i + 1}</Text>
                      <Text style={styles.dmText}>{dm}</Text>
                      <TouchableOpacity
                        style={[styles.copyBtn, copied === `${item.id}-${i}` && styles.copyBtnDone]}
                        onPress={() => handleCopy(dm, `${item.id}-${i}`)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.copyText, copied === `${item.id}-${i}` && styles.copyTextDone]}>
                          {copied === `${item.id}-${i}` ? '✓ Copied!' : '📋 Copy'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteBtnText}>🗑  Delete</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  clearBtn: { fontSize: 14, color: '#EF4444', fontWeight: '500' },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  emptySubtitle: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  platformDot: { width: 8, height: 8, borderRadius: 4 },
  platform: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  intent: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  time: { fontSize: 12, color: '#475569' },
  target: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  chevron: { color: '#334155', fontSize: 12, textAlign: 'right', marginTop: 4 },
  dmsWrap: { marginTop: 16, gap: 12 },
  dmRow: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  dmLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  dmText: { fontSize: 14, color: '#F1F5F9', lineHeight: 22, marginBottom: 10 },
  copyBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  copyBtnDone: { backgroundColor: '#052e16', borderColor: '#166534' },
  copyText: { fontSize: 12, fontWeight: '600', color: '#94A3B8' },
  copyTextDone: { color: '#4ade80' },
  deleteBtn: { alignItems: 'center', paddingVertical: 10 },
  deleteBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '500' },
});
