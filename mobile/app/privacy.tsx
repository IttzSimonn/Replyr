import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'Replyr does not collect personal information without your consent. When you use the app, we may collect anonymous usage data such as feature interactions and crash reports to improve the product. We do not store the messages you generate.',
  },
  {
    title: '2. How We Use Your Data',
    body: 'Data collected is used solely to improve app performance and user experience. We do not sell, share, or rent your personal information to third parties. Your generated DMs remain private and are not stored on our servers.',
  },
  {
    title: '3. AI-Generated Content',
    body: 'Messages generated through Replyr are powered by third-party AI services (Anthropic). Your inputs are sent to these services only for the purpose of generating content. Please review Anthropic\'s privacy policy for more information on how they handle data.',
  },
  {
    title: '4. Data Security',
    body: 'We implement industry-standard security measures to protect your data. API keys and sensitive credentials are stored securely using your device\'s encrypted keychain. We never store API keys on our servers.',
  },
  {
    title: '5. Third-Party Services',
    body: 'Replyr integrates with Anthropic\'s Claude API for AI-powered message generation. These services have their own privacy policies. We encourage you to review them before use.',
  },
  {
    title: '6. Your Rights',
    body: 'You have the right to access, correct, or delete any personal information we hold about you. To exercise these rights or for any privacy-related questions, contact us at privacy@replyr.app.',
  },
  {
    title: '7. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of any significant changes within the app. Continued use of Replyr after changes constitutes acceptance of the updated policy.',
  },
  {
    title: '8. Contact Us',
    body: 'If you have any questions about this Privacy Policy, please contact us at privacy@replyr.app. We aim to respond within 48 hours.',
  },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.textSec} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { color: colors.textMuted }]}>Last updated: April 2026</Text>
        <Text style={[styles.intro, { color: colors.textSec }]}>
          At Replyr, your privacy matters. This policy explains what information we collect, how we use
          it, and your rights regarding your data.
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
