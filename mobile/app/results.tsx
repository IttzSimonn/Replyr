import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { getLastDMs, getLastContext, setLastDMs, StoredDMs } from '../services/store';
import { generateDMs } from '../services/anthropic';

// ─── Constants ───────────────────────────────────────────────────────────────

const DM_META = [
  {
    label: 'Curiosity Hook',
    gradient: ['#7B61FF', '#9B81FF'] as const,
    why: 'Opens a loop they feel compelled to close',
  },
  {
    label: 'Direct Value',
    gradient: ['#059669', '#10B981'] as const,
    why: "Clearly shows what's in it for them",
  },
  {
    label: 'Casual Touch',
    gradient: ['#D97706', '#F59E0B'] as const,
    why: 'Low resistance — feels like a friend reaching out',
  },
];

const LOADING_STEPS = [
  'Analyzing your context...',
  'Finding the best angle...',
  'Crafting hooks...',
  'Writing your DMs...',
  'Polishing messages...',
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

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ResultsScreen() {
  const [dms, setDms] = useState<StoredDMs | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const cardAnims = useRef(
    [0, 1, 2].map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(30),
    })),
  ).current;

  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = getLastDMs();
    if (!stored) { router.replace('/'); return; }
    setDms(stored);
    animateIn();
  }, []);

  useEffect(() => {
    stepOpacity.setValue(0);
    Animated.timing(stepOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [stepIndex]);

  const animateIn = () => {
    cardAnims.forEach((a) => { a.opacity.setValue(0); a.translateY.setValue(30); });
    cardAnims.forEach((anim, i) => {
      Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1, duration: 480, delay: i * 130, useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
          toValue: 0, duration: 480, delay: i * 130, useNativeDriver: true,
        }),
      ]).start();
    });
  };

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

  const handleCopy = async (text: string, index: number) => {
    await Clipboard.setStringAsync(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRegenerate = async () => {
    const ctx = getLastContext();
    if (!ctx) { router.replace('/'); return; }

    setRegenerating(true);
    startCycling();
    Animated.timing(loadingOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();

    try {
      const newDms = await generateDMs(ctx);
      const stored: StoredDMs = { ...newDms, platform: dms?.platform ?? ctx.platform };
      setLastDMs(stored);
      setDms(stored);
      animateIn();
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

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerRow}>
          <Text style={styles.title}>Your DMs</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{dms.platform}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>3 high-converting messages, ready to send</Text>

        {DM_META.map((meta, i) => (
          <Animated.View
            key={i}
            style={[
              styles.card,
              {
                opacity: cardAnims[i].opacity,
                transform: [{ translateY: cardAnims[i].translateY }],
              },
            ]}
          >
            <LinearGradient
              colors={meta.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.stripe}
            />
            <View style={styles.cardInner}>
              <Text style={styles.cardLabel}>DM {i + 1} — {meta.label}</Text>
              <Text style={styles.message}>{messages[i] || '—'}</Text>
              <Text style={styles.why}>
                <Text style={styles.whyBold}>Why it works: </Text>
                {meta.why}
              </Text>
              <TouchableOpacity
                style={[styles.copyBtn, copied === i && styles.copyBtnDone]}
                onPress={() => handleCopy(messages[i] ?? '', i)}
                activeOpacity={0.7}
              >
                <Text style={[styles.copyText, copied === i && styles.copyTextDone]}>
                  {copied === i ? '✓ Copied!' : '📋 Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}

        <TouchableOpacity
          onPress={handleRegenerate}
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
            <Text style={styles.regenText}>↻  Regenerate All</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.newBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.newBtnText}>← Generate New DMs</Text>
        </TouchableOpacity>
      </ScrollView>

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
  back: { marginBottom: 20 },
  backText: { color: '#64748B', fontSize: 15, fontWeight: '500' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
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
  subtitle: { fontSize: 14, color: '#475569', marginBottom: 28 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  stripe: { height: 3 },
  cardInner: { padding: 20 },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  message: { fontSize: 16, color: '#F1F5F9', lineHeight: 26, marginBottom: 14 },
  why: { fontSize: 12, color: '#475569', marginBottom: 16, lineHeight: 18 },
  whyBold: { color: '#64748B', fontWeight: '600' },
  copyBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  copyBtnDone: { backgroundColor: '#052e16', borderColor: '#166534' },
  copyText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  copyTextDone: { color: '#4ade80' },
  regenOuter: {
    marginTop: 12,
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
