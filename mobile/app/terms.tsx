import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const SECTIONS = [
  {
    title: '1. Service',
    body: 'Replyr provides AI-generated message suggestions for informational and productivity purposes only. We do not guarantee outcomes, replies, or results.',
  },
  {
    title: '2. User Responsibility',
    body: 'You are fully responsible for how you use generated messages. Replyr is not liable for any consequences resulting from usage.',
  },
  {
    title: '3. Accounts',
    body: 'You agree to provide accurate information and keep your account secure. We may suspend accounts that violate these terms.',
  },
  {
    title: '4. Payments & Subscriptions',
    body: 'Replyr may offer paid subscriptions. All payments are handled through official app store providers. Subscriptions may renew automatically unless cancelled.',
  },
  {
    title: '5. Acceptable Use',
    body: 'You may not use Replyr for spam, harassment, illegal activities, or harmful or abusive communication.',
  },
  {
    title: '6. Limitation of Liability',
    body: 'Replyr is provided "as is". We are not liable for any damages, losses, or outcomes related to usage.',
  },
  {
    title: '7. Changes',
    body: 'We may update these terms at any time.',
  },
  {
    title: '8. Contact',
    body: 'For questions, contact: support@replyr.app',
  },
];

export default function TermsScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.textSec} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { color: colors.textMuted }]}>Last updated: April 2026</Text>
        <Text style={[styles.intro, { color: colors.textSec }]}>
          By using Replyr, you agree to the following terms.
        </Text>

        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{s.title}</Text>
            <Text style={[styles.sectionBody, { color: colors.textSec }]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  back: { width: 40 },
  title: { fontSize: 17, fontWeight: '700' },
  scroll: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 48,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  updated: { fontSize: 12, marginBottom: 12 },
  intro: { fontSize: 15, lineHeight: 24, marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
});
