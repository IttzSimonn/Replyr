import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { getApiKey, saveApiKey, deleteApiKey } from '../services/anthropic';

export default function SettingsScreen() {
  const [key, setKey] = useState('');
  const [masked, setMasked] = useState('');
  const [hasSaved, setHasSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getApiKey().then((k) => {
      if (k) {
        setHasSaved(true);
        setMasked(maskKey(k));
      }
    });
  }, []);

  const handleSave = async () => {
    const trimmed = key.trim();
    if (!trimmed) {
      Alert.alert('Empty key', 'Please paste your Anthropic API key.');
      return;
    }
    if (!trimmed.startsWith('sk-ant-')) {
      Alert.alert(
        'Invalid key',
        'Anthropic API keys start with "sk-ant-". Please check and try again.',
      );
      return;
    }
    setSaving(true);
    try {
      await saveApiKey(trimmed);
      setHasSaved(true);
      setMasked(maskKey(trimmed));
      setKey('');
      Alert.alert('Saved', 'API key saved securely on this device.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to save the key. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Remove API Key', 'Are you sure? You will need to re-enter it to use Replyr.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteApiKey();
          setHasSaved(false);
          setMasked('');
          setKey('');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Anthropic API Key</Text>
        <Text style={styles.sectionDesc}>
          Your key is stored securely on this device using the OS keychain. It is
          never sent anywhere other than the Anthropic API.
        </Text>

        {hasSaved && (
          <View style={styles.savedRow}>
            <Text style={styles.savedLabel}>Current key</Text>
            <Text style={styles.savedValue}>{masked}</Text>
            <TouchableOpacity onPress={handleDelete} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.inputLabel}>
          {hasSaved ? 'Replace with a new key' : 'Paste your API key'}
        </Text>
        <TextInput
          style={styles.input}
          placeholder="sk-ant-api03-..."
          placeholderTextColor="#9CA3AF"
          value={key}
          onChangeText={setKey}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={false}
          spellCheck={false}
        />

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>Save API Key</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How to get a key</Text>
        <Text style={styles.step}>1. Go to platform.anthropic.com</Text>
        <Text style={styles.step}>2. Sign in or create an account</Text>
        <Text style={styles.step}>3. Open API Keys → Create Key</Text>
        <Text style={styles.step}>4. Copy and paste it above</Text>
      </View>
    </ScrollView>
  );
}

function maskKey(k: string): string {
  if (k.length <= 12) return '***';
  return k.slice(0, 10) + '···' + k.slice(-4);
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 16,
  },
  savedRow: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  savedLabel: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  savedValue: {
    fontSize: 13,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 1,
  },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  removeBtnText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: '#1A1A2E',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#6C63FF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  step: {
    fontSize: 14,
    color: '#374151',
    paddingVertical: 5,
    lineHeight: 22,
  },
});

