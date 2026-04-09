import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { getLastDMs, StoredDMs } from '../services/store';

const DM_META = [
  {
    label: 'DM 1 — Curiosity Hook',
    emoji: '🎯',
    color: '#6C63FF',
    bg: '#F0EFFE',
    description: 'Makes them want to reply',
  },
  {
    label: 'DM 2 — Direct Value',
    emoji: '💎',
    color: '#059669',
    bg: '#ECFDF5',
    description: 'Shows clear benefit of responding',
  },
  {
    label: 'DM 3 — Casual Touch',
    emoji: '💬',
    color: '#D97706',
    bg: '#FFFBEB',
    description: 'Natural and easy to respond to',
  },
];

export default function ResultsScreen() {
  const [dms, setDms] = useState<StoredDMs | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    const stored = getLastDMs();
    if (!stored) {
      router.replace('/');
    } else {
      setDms(stored);
    }
  }, []);

  const handleCopy = async (text: string, index: number) => {
    await Clipboard.setStringAsync(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!dms) return null;

  const messages = [dms.dm1, dms.dm2, dms.dm3];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.subtitle}>
        Tailored for <Text style={styles.platform}>{dms.platform}</Text>
      </Text>

      {DM_META.map((meta, i) => (
        <View key={i} style={styles.card}>
          <View style={[styles.cardHeader, { backgroundColor: meta.bg }]}>
            <Text style={styles.cardEmoji}>{meta.emoji}</Text>
            <View>
              <Text style={[styles.cardLabel, { color: meta.color }]}>{meta.label}</Text>
              <Text style={styles.cardDesc}>{meta.description}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.messageText}>{messages[i] || '—'}</Text>
            <TouchableOpacity
              style={[styles.copyBtn, copied === i && styles.copyBtnDone]}
              onPress={() => handleCopy(messages[i] ?? '', i)}
              activeOpacity={0.7}
            >
              <Text style={[styles.copyBtnText, copied === i && styles.copyBtnTextDone]}>
                {copied === i ? '✓ Copied!' : '📋 Copy'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={styles.newBtn}
        onPress={() => router.back()}
        activeOpacity={0.8}
      >
        <Text style={styles.newBtnText}>← Generate New DMs</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: 48,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  platform: {
    fontWeight: '700',
    color: '#6C63FF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  cardEmoji: { fontSize: 24 },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cardBody: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  messageText: {
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 24,
    marginBottom: 14,
  },
  copyBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  copyBtnDone: { backgroundColor: '#D1FAE5' },
  copyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  copyBtnTextDone: { color: '#059669' },
  newBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  newBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
