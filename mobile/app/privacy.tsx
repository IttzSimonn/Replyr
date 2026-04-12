import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const SECTIONS = [
  {
    title: '1. Data We Collect',
    body: 'We collect account information (email, login provider), usage data (app interactions), and generated inputs (only to provide the service).',
  },
  {
    title: '2. How We Use Data',
    body: 'We use data to operate the app, improve performance, and personalize user experience.',
  },
  {
    title: '3. AI Processing',
    body: 'Your inputs may be processed by third-party AI providers to generate responses.',
  },
  {
    title: '4. Data Security',
    body: 'We use industry-standard measures to protect your data.',
  },
  {
    title: '5. No Selling of Data',
    body: 'We do not sell your personal data.',
  },
  {
    title: '6. Your Rights',
    body: 'You can request deletion of your data at any time.',
  },
  {
    title: '7. Contact',
    body: 'support@replyr.app',
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
          We respect your privacy.
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
