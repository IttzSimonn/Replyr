import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { getLastDMs, getLastContext, setLastDMs, StoredDMs } from '../services/store';
import { generateDMs } from '../services/anthropic';
import { addToHistory } from '../services/history';

const { width } = Dimensions.get('window');

// ─── Constants ───────────────────────────────────────────────────────────────

const DM_META = [
  {
    label: 'Curiosity Hook',
    gradient: ['#7B61FF', '#9B81FF'] as const,
    why: 'Opens a loop they feel compelled to close',
    replyRate: 82,
  },
  {
    label: 'Direct Value',
    gradient: ['#059669', '#10B981'] as const,
    why: "Clearly shows what's in it for them",
    replyRate: 74,
  },
  {
    label: 'Casual Touch',
    gradient: ['#D97706', '#F59E0B'] as const,
    why: 'Low resistance — feels like a friend reaching out',
    replyRate: 89,
  },
];

const LOADING_STEPS = [
  'Analyzing your context...',
  'Finding the best angle...',
  'Crafting hooks...',
  'Writing your DMs...',
  'Polishing messages...',
];

const REFINE_ACTIONS = [
  { label: 'Shorter', instruction: 'Make each DM shorter and more punchy — max 2 lines.' },
  { label: 'More confident', instruction: 'Make each DM bolder and more confident in tone.' },
  { label: 'More casual', instruction: 'Make each DM feel more casual and relaxed.' },
  { label: 'More persuasive', instruction: 'Make each DM more persuasive with a stronger hook.' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function BounceDot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -10, duration: 350, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.delay(Math.max(0, 900 - delay)),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[styles.dot, { transform: [{ translateY: anim }] }]} />;
}

function TypingText({ text, style, delay = 0 }: { text: string; style?: any; delay?: number }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const start = setTimeout(() => {
      const timer = setInterval(() => {
        i++;
        if (i > text.length) { clearInterval(timer); return; }
        setDisplayed(text.slice(0, i));
      }, 11);
      return () => clearInterval(timer);
    }, delay);
    return () => clearTimeout(start);
  }, [text]);

  return <Text style={style}>{displayed || ' '}</Text>;
}

function CopyToast({ copyKey }: { copyKey: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (copyKey === 0) return;
    opacity.setValue(0);
    translateY.setValue(10);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }, 1400);
    });
  }, [copyKey]);

  return (
    <Animated.View
      style={[styles.toast, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <Ionicons name="checkmark-circle" size={15} color="#4ade80" />
      <Text style={styles.toastText}>Copied to clipboard</Text>
    </Animated.View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ResultsScreen() {
  const [dms, setDms] = useState<StoredDMs | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [saved, setSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [copyKey, setCopyKey] = useState(0);

  const swipeRef = useRef<ScrollView>(null);
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    const stored = getLastDMs();
    if (!stored) { router.replace('/(tabs)'); return; }
    setDms(stored);

    if (!savedRef.current) {
      savedRef.current = true;
      const ctx = getLastContext();
      addToHistory({
        platform: stored.platform,
        intent: ctx?.intent ?? '',
        target: ctx?.target ?? '',
        dm1: stored.dm1,
        dm2: stored.dm2,
        dm3: stored.dm3,
      });
    }
  }, []);

  useEffect(() => {
    stepOpacity.setValue(0);
    Animated.timing(stepOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [stepIndex]);

  const startCycling = () => {
    let idx = 0;
    setStepIndex(0);
    intervalRef.current = setInterval(() => {
      idx = (idx + 1) % LOADING_STEPS.length;
      setStepIndex(idx);
    }, 1100);
  };

  const stopCycling = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleCopy = async () => {
    if (!dms) return;
    const msg = [dms.dm1, dms.dm2, dms.dm3][activePage] ?? '';
    await Clipboard.setStringAsync(msg);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCopyKey((k) => k + 1);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const runRegenerate = async (extraInstruction?: string) => {
    const ctx = getLastContext();
    if (!ctx) { router.replace('/(tabs)'); return; }

    const contextWithNote = extraInstruction
      ? { ...ctx, targetContext: `${ctx.targetContext ?? ''}\n\nStyle note: ${extraInstruction}`.trim() }
      : ctx;

    setRegenerating(true);
    startCycling();
    Animated.timing(loadingOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();

    try {
      const newDms = await generateDMs(contextWithNote);
      const stored: StoredDMs = { ...newDms, platform: dms?.platform ?? ctx.platform };
      setLastDMs(stored);
      setDms(stored);
      setActivePage(0);
      swipeRef.current?.scrollTo({ x: 0, animated: false });
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to regenerate. Try again.');
    } finally {
      stopCycling();
      Animated.timing(loadingOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        () => setRegenerating(false),
      );
    }
  };

  if (!dms) return null;

  const messages = [dms.dm1, dms.dm2, dms.dm3];
  const currentMeta = DM_META[activePage];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={20} color="#64748B" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={styles.title}>Your DMs</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{dms.platform}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Swipe to switch between variations</Text>

        {/* Swipeable DM cards */}
        <View style={styles.swipeContainer}>
          <ScrollView
            ref={swipeRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const p = Math.round(e.nativeEvent.contentOffset.x / (width - 48));
              if (p !== activePage) setActivePage(Math.min(2, Math.max(0, p)));
            }}
          >
            {DM_META.map((meta, i) => (
              <View key={i} style={[styles.dmCard, { width: width - 48 }]}>
                <LinearGradient
                  colors={meta.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dmStripe}
                />
                <View style={styles.dmInner}>
                  <Text style={styles.dmLabel}>DM {i + 1} — {meta.label}</Text>

                  {/* Chat bubble with typing animation */}
                  <View style={styles.bubble}>
                    <TypingText
                      text={messages[i] || ''}
                      style={styles.bubbleText}
                      delay={i * 100}
                    />
                  </View>

                  {/* Reply rate */}
                  <View style={styles.insightRow}>
                    <LinearGradient
                      colors={meta.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.insightPill}
                    >
                      <Text style={styles.insightText}>
                        ↑ ~{meta.replyRate}% estimated reply rate
                      </Text>
                    </LinearGradient>
                  </View>

                  {/* Why it works */}
                  <Text style={styles.why}>
                    <Text style={styles.whyBold}>Why it works: </Text>
                    {meta.why}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Dot indicators */}
          <View style={styles.pageDots}>
            {DM_META.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActivePage(i);
                  swipeRef.current?.scrollTo({ x: i * (width - 48), animated: true });
                }}
              >
                <View
                  style={[
                    styles.pageDot,
                    activePage === i && styles.pageDotActive,
                    activePage === i && { backgroundColor: currentMeta.gradient[0] },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCopy} activeOpacity={0.75}>
            <Ionicons name="copy-outline" size={15} color="#94A3B8" />
            <Text style={styles.actionBtnText}>Copy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, saved && styles.actionBtnSaved]}
            onPress={handleSave}
            activeOpacity={0.75}
          >
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={15}
              color={saved ? '#818cf8' : '#94A3B8'}
            />
            <Text style={[styles.actionBtnText, saved && styles.actionBtnTextSaved]}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => runRegenerate()}
            activeOpacity={0.75}
            disabled={regenerating}
          >
            <Ionicons name="refresh-outline" size={15} color="#94A3B8" />
            <Text style={styles.actionBtnText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* AI refinement */}
        <View style={styles.refineSection}>
          <Text style={styles.refineTitle}>REFINE ALL DMS</Text>
          <View style={styles.refineChips}>
            {REFINE_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.refineChip}
                onPress={() => runRegenerate(action.instruction)}
                disabled={regenerating}
                activeOpacity={0.75}
              >
                <Text style={styles.refineChipText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tip */}
        <View style={styles.tip}>
          <Text style={styles.tipText}>
            Tip: shorter messages consistently get higher reply rates
          </Text>
        </View>

        {/* Regenerate all */}
        <TouchableOpacity
          onPress={() => runRegenerate()}
          disabled={regenerating}
          activeOpacity={0.85}
          style={[styles.regenOuter, regenerating && { opacity: 0.5 }]}
        >
          <LinearGradient
            colors={['#7B61FF', '#5B9CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.regenBtn}
          >
            <Text style={styles.regenText}>Regenerate All</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.newBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.newBtnText}>Generate New DMs</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Copy toast */}
      <View style={styles.toastWrap} pointerEvents="none">
        <CopyToast copyKey={copyKey} />
      </View>

      {/* Loading overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: loadingOpacity }]}
        pointerEvents={regenerating ? 'auto' : 'none'}
      >
        <View style={styles.loadingInner}>
          <View style={styles.dots}>
            <BounceDot delay={0} />
            <BounceDot delay={200} />
            <BounceDot delay={400} />
          </View>
          <Animated.Text style={[styles.stepText, { opacity: stepOpacity }]}>
            {LOADING_STEPS[stepIndex]}
          </Animated.Text>
          <Text style={styles.stepHint}>Crafting fresh messages...</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 60,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { color: '#64748B', fontSize: 15, fontWeight: '500' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  title: { fontSize: 30, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  badge: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  subtitle: { fontSize: 13, color: '#475569', marginBottom: 20 },

  // Swipe
  swipeContainer: { marginHorizontal: -24, marginBottom: 16 },
  dmCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginHorizontal: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dmStripe: { height: 3 },
  dmInner: { padding: 20 },
  dmLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  bubble: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    minHeight: 80,
  },
  bubbleText: { fontSize: 16, color: '#F1F5F9', lineHeight: 26 },
  insightRow: { marginBottom: 12 },
  insightPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  insightText: { fontSize: 12, color: '#FFFFFF', fontWeight: '600' },
  why: { fontSize: 12, color: '#475569', lineHeight: 18 },
  whyBold: { color: '#64748B', fontWeight: '600' },

  // Dots
  pageDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingHorizontal: 24,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
  },
  pageDotActive: { width: 24 },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnSaved: { backgroundColor: '#1e1b4b', borderColor: '#3730a3' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  actionBtnTextSaved: { color: '#818cf8' },

  // Refinement
  refineSection: { marginBottom: 16 },
  refineTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1,
    marginBottom: 10,
  },
  refineChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  refineChip: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  refineChipText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },

  // Tip
  tip: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tipText: { fontSize: 13, color: '#64748B', lineHeight: 20 },

  // Regen
  regenOuter: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  regenBtn: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  regenText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.2 },
  newBtn: { alignItems: 'center', paddingVertical: 14 },
  newBtnText: { fontSize: 14, color: '#475569', fontWeight: '500' },

  // Toast
  toastWrap: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toastText: { fontSize: 14, color: '#F1F5F9', fontWeight: '600' },

  // Loading
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.93)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingInner: { alignItems: 'center', paddingHorizontal: 32 },
  dots: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7B61FF' },
  stepText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  stepHint: { fontSize: 14, color: '#475569', textAlign: 'center' },
});
