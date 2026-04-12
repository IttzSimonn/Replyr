import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const SECTIONS = [
  {
    title: '1. Data Controller',
    body: 'Replyr is the data controller responsible for your personal data. Replyr is established in Belgium. Contact: support@replyr.app.',
  },
  {
    title: '2. Data We Collect',
    body: 'We collect the following data:\n\n• Account information: email address and authentication provider (Apple, Google, or email) when you create an account.\n• Usage data: app interactions, feature usage, and generation counts — used to improve the service.\n• Generated inputs: the text you enter (target, goal, context) is sent to our AI provider to generate messages. We do not permanently store your inputs after the response is delivered.',
  },
  {
    title: '3. Legal Basis for Processing (GDPR)',
    body: 'We process your personal data on the following legal bases under GDPR Article 6:\n\n• Performance of a contract (Art. 6(1)(b)): processing your account information and inputs is necessary to deliver the service you requested.\n• Legitimate interests (Art. 6(1)(f)): we use anonymous usage data to improve the App. We have assessed that this does not override your rights and freedoms.',
  },
  {
    title: '4. How We Use Your Data',
    body: 'We use your data exclusively to:\n\n• Create and manage your account\n• Deliver AI-generated messages based on your inputs\n• Improve app performance and user experience\n• Send important service updates (not marketing without consent)',
  },
  {
    title: '5. Third-Party Data Processors',
    body: 'We share data with the following trusted sub-processors:\n\n• Supabase (supabase.com) — authentication and account storage. Data may be stored on servers in the EU or USA under the EU-US Data Privacy Framework.\n• Anthropic (anthropic.com) — AI processing of your message inputs. Anthropic processes your inputs solely to generate responses. Review Anthropic\'s privacy policy at anthropic.com/privacy.\n\nWe do not sell your data to any third party.',
  },
  {
    title: '6. International Data Transfers',
    body: 'Some of our processors are based in the United States. Where data is transferred outside the European Economic Area (EEA), we ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) or adequacy decisions as required by GDPR.',
  },
  {
    title: '7. Data Retention',
    body: 'We retain your data for as long as your account is active. If you delete your account, your personal data is deleted within 30 days. Anonymous usage statistics may be retained for up to 12 months in aggregated form. You may request deletion at any time — see Section 9.',
  },
  {
    title: '8. Cookies and Local Storage',
    body: 'Replyr is a mobile app and does not use browser cookies. We use your device\'s secure local storage (Expo SecureStore) to save your preferences and usage count. This data never leaves your device unless explicitly described in this policy.',
  },
  {
    title: '9. Your Rights (GDPR)',
    body: 'Under GDPR, you have the following rights:\n\n• Right of access: request a copy of your personal data.\n• Right to rectification: correct inaccurate data.\n• Right to erasure ("right to be forgotten"): request deletion of your data.\n• Right to data portability: receive your data in a machine-readable format.\n• Right to restriction: ask us to limit how we process your data.\n• Right to object: object to processing based on legitimate interests.\n\nTo exercise any of these rights, contact us at support@replyr.app. We will respond within 30 days.',
  },
  {
    title: '10. Children\'s Privacy',
    body: 'Replyr is not intended for users under 13. We do not knowingly collect personal data from children. If we become aware that we have collected data from a child under 13, we will delete it immediately.',
  },
  {
    title: '11. Data Security',
    body: 'We implement industry-standard technical and organisational measures to protect your data, including encrypted storage, secure HTTPS communication, and access controls. However, no method of transmission over the internet is 100% secure.',
  },
  {
    title: '12. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. If we make material changes, we will notify you via the App or by email. The updated date at the top of this page reflects the latest revision. Continued use after changes constitutes acceptance.',
  },
  {
    title: '13. Supervisory Authority',
    body: 'If you believe we are not handling your data in compliance with GDPR, you have the right to lodge a complaint with your local data protection authority. Our lead supervisory authority is the Belgian Data Protection Authority (Gegevensbeschermingsautoriteit / Autorité de protection des données) — gegevensbeschermingsautoriteit.be. You may also contact the supervisory authority in your own country of residence.',
  },
  {
    title: '14. Contact',
    body: 'For any privacy-related questions or requests, contact us at:\nsupport@replyr.app\n\nWe aim to respond within 5 business days.',
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
        <Text style={[styles.updated, { color: colors.textMuted }]}>Last updated: April 12, 2026</Text>
        <Text style={[styles.intro, { color: colors.textSec }]}>
          This Privacy Policy explains what personal data Replyr collects, why, and how it is used.
          It is written in compliance with the EU General Data Protection Regulation (GDPR) and
          applies to all users of the Replyr app.
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
