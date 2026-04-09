import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { generateDMs, DMContext } from '../services/anthropic';
import { setLastDMs } from '../services/store';

const FIELDS: Array<{
  key: keyof DMContext;
  label: string;
  placeholder: string;
  optional?: boolean;
  multiline?: boolean;
}> = [
  { key: 'intent', label: 'Intent', placeholder: 'e.g. sell, collaborate, network' },
  { key: 'target', label: 'Target Person', placeholder: 'Who are you messaging?' },
  { key: 'goal', label: 'Goal', placeholder: 'What do you want to happen?' },
  { key: 'tone', label: 'Tone', placeholder: 'e.g. confident, friendly, direct' },
  { key: 'platform', label: 'Platform', placeholder: 'e.g. Instagram, LinkedIn, WhatsApp' },
  { key: 'senderInfo', label: 'About You', placeholder: 'Brief info about you / your offer' },
  {
    key: 'targetContext',
    label: 'Target Context',
    placeholder: 'Optional: extra details about them (their posts, business, vibe...)',
    optional: true,
    multiline: true,
  },
];

const EMPTY_FORM: DMContext = {
  intent: '',
  target: '',
  goal: '',
  tone: '',
  platform: '',
  senderInfo: '',
  targetContext: '',
};

export default function HomeScreen() {
  const [form, setForm] = useState<DMContext>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    const required: Array<keyof DMContext> = [
      'intent', 'target', 'goal', 'tone', 'platform', 'senderInfo',
    ];
    for (const key of required) {
      if (!form[key].trim()) {
        const field = FIELDS.find((f) => f.key === key);
        Alert.alert('Required field', `Please fill in "${field?.label}".`);
        return;
      }
    }

    setLoading(true);
    try {
      const dms = await generateDMs(form);
      setLastDMs({ ...dms, platform: form.platform });
      router.push('/results');
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to generate DMs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setField = (key: keyof DMContext, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Fill in the context below to generate 3 high-converting DMs.
        </Text>

        {FIELDS.map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.label}>
              {field.label}
              {field.optional && <Text style={styles.optional}> — optional</Text>}
            </Text>
            <TextInput
              style={[styles.input, field.multiline && styles.inputMulti]}
              placeholder={field.placeholder}
              placeholderTextColor="#9CA3AF"
              value={form[field.key]}
              onChangeText={(v) => setField(field.key, v)}
              multiline={field.multiline}
              numberOfLines={field.multiline ? 3 : 1}
              textAlignVertical={field.multiline ? 'top' : 'center'}
              autoCapitalize="sentences"
              returnKeyType={field.multiline ? 'default' : 'next'}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleGenerate}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Generate DMs ✨</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
    marginBottom: 24,
    lineHeight: 22,
  },
  fieldGroup: { marginBottom: 18 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  optional: {
    fontWeight: '400',
    color: '#9CA3AF',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1A1A2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputMulti: {
    minHeight: 90,
    paddingTop: 13,
  },
  button: {
    backgroundColor: '#6C63FF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
