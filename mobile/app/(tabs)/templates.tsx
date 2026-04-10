import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { setPendingTemplate } from '../../services/store';
import { DMContext } from '../../services/anthropic';

interface Template {
  id: string;
  name: string;
  description: string;
  emoji: string;
  gradient: readonly [string, string];
  data: Partial<DMContext>;
}

const TEMPLATES: Template[] = [
  {
    id: '1',
    name: 'Cold Outreach',
    description: 'First contact with a prospect or potential client',
    emoji: '🚀',
    gradient: ['#7B61FF', '#5B9CFF'],
    data: { intent: 'Sell', tone: 'Confident', goal: 'Book a call or get a reply' },
  },
  {
    id: '2',
    name: 'Follow-Up',
    description: 'Re-engage someone who has not replied yet',
    emoji: '🔁',
    gradient: ['#059669', '#10B981'],
    data: { intent: 'Sell', tone: 'Friendly', goal: 'Re-engage after no reply' },
  },
  {
    id: '3',
    name: 'Closing',
    description: 'Push a warm lead to make a decision',
    emoji: '✅',
    gradient: ['#D97706', '#F59E0B'],
    data: { intent: 'Sell', tone: 'Direct', goal: 'Close the deal' },
  },
  {
    id: '4',
    name: 'Reactivation',
    description: 'Reconnect with an old contact or past client',
    emoji: '🔥',
    gradient: ['#EF4444', '#F97316'],
    data: { intent: 'Network', tone: 'Friendly', goal: 'Reconnect and start a new conversation' },
  },
  {
    id: '5',
    name: 'Collaboration',
    description: 'Pitch a partnership or joint project idea',
    emoji: '🤝',
    gradient: ['#3B82F6', '#6366F1'],
    data: { intent: 'Collab', tone: 'Confident', goal: 'Propose a collaboration or partnership' },
  },
  {
    id: '6',
    name: 'Networking',
    description: 'Connect with someone in your industry',
    emoji: '🌐',
    gradient: ['#06B6D4', '#3B82F6'],
    data: { intent: 'Network', tone: 'Friendly', goal: 'Build a genuine connection' },
  },
  {
    id: '7',
    name: 'Job Outreach',
    description: 'Reach out about a role or opportunity',
    emoji: '💼',
    gradient: ['#8B5CF6', '#A78BFA'],
    data: { intent: 'Recruit', tone: 'Formal', goal: 'Get an interview or introduction call' },
  },
  {
    id: '8',
    name: 'Influencer Ask',
    description: 'Request a shoutout, review or content collab',
    emoji: '⭐',
    gradient: ['#EC4899', '#F43F5E'],
    data: { intent: 'Collab', tone: 'Playful', goal: 'Get a content collaboration or mention' },
  },
];

export default function TemplatesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSelect = (template: Template) => {
    setPendingTemplate(template.data);
    router.navigate('/(tabs)/');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Templates</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Tap any template to auto-fill the generator
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {TEMPLATES.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => handleSelect(t)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={t.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.stripe}
            />
            <View style={styles.cardInner}>
              <LinearGradient
                colors={t.gradient}
                style={styles.emojiWrap}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.emoji}>{t.emoji}</Text>
              </LinearGradient>

              <View style={styles.cardBody}>
                <Text style={[styles.name, { color: colors.text }]}>{t.name}</Text>
                <Text style={[styles.desc, { color: colors.textSec }]}>{t.description}</Text>
                <View style={styles.tags}>
                  <View style={[styles.tag, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Text style={[styles.tagText, { color: colors.textMuted }]}>{t.data.intent}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    <Text style={[styles.tagText, { color: colors.textMuted }]}>{t.data.tone}</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.arrow, { color: colors.border }]}>→</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles (layout only — no colors) ────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { fontSize: 14 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 40, gap: 12, maxWidth: 640, alignSelf: 'center', width: '100%' },
  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  stripe: { height: 3 },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  emojiWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  cardBody: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  desc: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  tags: { flexDirection: 'row', gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  tagText: { fontSize: 11, fontWeight: '600' },
  arrow: { fontSize: 18, fontWeight: '300' },
});
