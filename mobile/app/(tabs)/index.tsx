import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext';
import { generateDMs, DMContext } from '../../services/anthropic';
import { setLastDMs, setLastContext, consumePendingTemplate } from '../../services/store';

const INTENTS = ['Sell', 'Collab', 'Network', 'Recruit', 'Other'];
const TONES = ['Confident', 'Friendly', 'Direct', 'Playful', 'Formal'];
const PLATFORMS = ['Instagram', 'LinkedIn', 'WhatsApp', 'Email', 'Twitter/X'];

const LOADING_STEPS = [
  'Analyzing context...',
  'Adapting tone...',
  'Optimizing for reply rate...',
  'Generating high-converting DM...',
  'Polishing...',
];

const GREETINGS = [
  'Ready to get more replies today?',
  'Who are you reaching out to?',
  "Let's craft something they can't ignore.",
  'Your next reply is one tap away.',
];

const FORM_KEY = 'saved_form';

// ─── Sub-components (each calls useTheme internally) ─────────────────────────

function SectionLabel({ label }: { label: string }) {
  const { colors } = useTheme();
  return <Text style={[sectionStyles.label, { color: colors.textMuted }]}>{label}</Text>;
}

const sectionStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, textTransform: 'uppercase' },
});

function ChipRow({ options, selected, onSelect }: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(active ? '' : opt)}
            activeOpacity={0.75}
            style={[
              chipStyles.chip,
              { backgroundColor: colors.surface, borderColor: active ? 'transparent' : colors.border },
            ]}
          >
            {active && (
              <LinearGradient
                colors={['#7B61FF', '#5B9CFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text style={[chipStyles.text, { color: active ? '#FFFFFF' : colors.textSec }]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  text: { fontSize: 14, fontWeight: '500' },
});

function InputCard({ icon, label, optional, placeholder, value, onChangeText, multiline }: {
  icon: string;
  label: string;
  optional?: boolean;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[cardStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={cardStyles.icon}>{icon}</Text>
      <View style={cardStyles.body}>
        <Text style={[cardStyles.label, { color: colors.textSec }]}>
          {label}
          {optional && <Text style={[cardStyles.optional, { color: colors.textMuted }]}> — optional</Text>}
        </Text>
        <TextInput
          style={[cardStyles.input, multiline && cardStyles.inputMulti, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
          autoCapitalize="sentences"
          returnKeyType={multiline ? 'default' : 'next'}
        />
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1, gap: 12 },
  icon: { fontSize: 20, marginTop: 1 },
  body: { flex: 1 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  optional: { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
  input: { fontSize: 15, padding: 0 },
  inputMulti: { minHeight: 72 },
});

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

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [intent, setIntent] = useState('');
  const [target, setTarget] = useState('');
  const [goal, setGoal] = useState('');
  const [tone, setTone] = useState('');
  const [platform, setPlatform] = useState('');
  const [senderInfo, setSenderInfo] = useState('');
  const [targetContext, setTargetContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [greeting] = useState(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(16)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(FORM_KEY).then((raw) => {
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.intent) setIntent(saved.intent);
        if (saved.target) setTarget(saved.target);
        if (saved.goal) setGoal(saved.goal);
        if (saved.tone) setTone(saved.tone);
        if (saved.platform) setPlatform(saved.platform);
        if (saved.senderInfo) setSenderInfo(saved.senderInfo);
        if (saved.targetContext) setTargetContext(saved.targetContext);
      } catch {}
    });
  }, []);

  const scheduleFormSave = (patch: object) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const raw = await SecureStore.getItemAsync(FORM_KEY);
      const current = raw ? JSON.parse(raw) : {};
      await SecureStore.setItemAsync(FORM_KEY, JSON.stringify({ ...current, ...patch }));
    }, 500);
  };

  const setAndSaveIntent = (v: string) => { setIntent(v); scheduleFormSave({ intent: v }); };
  const setAndSaveTarget = (v: string) => { setTarget(v); scheduleFormSave({ target: v }); };
  const setAndSaveGoal = (v: string) => { setGoal(v); scheduleFormSave({ goal: v }); };
  const setAndSaveTone = (v: string) => { setTone(v); scheduleFormSave({ tone: v }); };
  const setAndSavePlatform = (v: string) => { setPlatform(v); scheduleFormSave({ platform: v }); };
  const setAndSaveSenderInfo = (v: string) => { setSenderInfo(v); scheduleFormSave({ senderInfo: v }); };
  const setAndSaveTargetContext = (v: string) => { setTargetContext(v); scheduleFormSave({ targetContext: v }); };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    stepOpacity.setValue(0);
    Animated.timing(stepOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [stepIndex]);

  useFocusEffect(
    useCallback(() => {
      const t = consumePendingTemplate();
      if (t) {
        if (t.intent) setIntent(t.intent);
        if (t.tone) setTone(t.tone);
        if (t.goal) setGoal(t.goal);
        if (t.platform) setPlatform(t.platform);
      }
    }, []),
  );

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

  const handleGenerate = async () => {
    if (!intent) { Alert.alert('Pick an intent', 'What is this DM for?'); return; }
    if (!target.trim()) { Alert.alert('Required', 'Who are you messaging?'); return; }
    if (!goal.trim()) { Alert.alert('Required', "What's your goal?"); return; }
    if (!tone) { Alert.alert('Pick a tone', 'How should these messages sound?'); return; }
    if (!platform) { Alert.alert('Pick a platform', 'Where are you sending this?'); return; }
    if (!senderInfo.trim()) { Alert.alert('Required', 'Add a bit about yourself.'); return; }

    const context: DMContext = { intent, target, goal, tone, platform, senderInfo, targetContext };
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    setLoading(true);
    startCycling();
    Animated.timing(loadingOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();

    try {
      setLastContext(context);
      const dms = await generateDMs(context);
      setLastDMs({ ...dms, platform });
      router.push('/results');
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message ?? 'Please try again.');
    } finally {
      stopCycling();
      Animated.timing(loadingOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        () => setLoading(false),
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroSlide }] }}>
            <Text style={[styles.greeting, { color: colors.text }]}>{greeting}</Text>
            <Text style={[styles.helper, { color: colors.textMuted }]}>
              We'll optimize tone and structure for the best reply rate.
            </Text>
          </Animated.View>

          <View style={styles.section}>
            <SectionLabel label="Intent" />
            <ChipRow options={INTENTS} selected={intent} onSelect={setAndSaveIntent} />
          </View>

          <View style={styles.gap}>
            <InputCard icon="👤" label="Target Person" placeholder="Who are you messaging?" value={target} onChangeText={setAndSaveTarget} />
          </View>
          <View style={styles.gap}>
            <InputCard icon="🎯" label="Goal" placeholder="What do you want to happen?" value={goal} onChangeText={setAndSaveGoal} />
          </View>

          <View style={styles.section}>
            <SectionLabel label="Tone" />
            <ChipRow options={TONES} selected={tone} onSelect={setAndSaveTone} />
          </View>

          <View style={styles.section}>
            <SectionLabel label="Platform" />
            <ChipRow options={PLATFORMS} selected={platform} onSelect={setAndSavePlatform} />
          </View>

          <View style={styles.gap}>
            <InputCard icon="💼" label="About You" placeholder="Brief info about you or your offer" value={senderInfo} onChangeText={setAndSaveSenderInfo} />
          </View>
          <View style={styles.gap}>
            <InputCard icon="💡" label="Target Context" optional placeholder="Their posts, business, vibe..." value={targetContext} onChangeText={setAndSaveTargetContext} multiline />
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.stickyBottom, { backgroundColor: colors.bg, borderTopColor: colors.surface }]}>
          <TouchableOpacity
            onPress={handleGenerate}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.btnOuter, loading && styles.btnDisabled]}
          >
            <LinearGradient
              colors={['#7B61FF', '#5B9CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Generate DMs ✨</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Animated.View
        style={[styles.overlay, { opacity: loadingOpacity, backgroundColor: colors.overlay }]}
        pointerEvents={loading ? 'auto' : 'none'}
      >
        <View style={styles.loadingInner}>
          <View style={styles.dots}>
            <BounceDot delay={0} />
            <BounceDot delay={200} />
            <BounceDot delay={400} />
          </View>
          <Animated.Text style={[styles.stepText, { opacity: stepOpacity, color: colors.text }]}>
            {LOADING_STEPS[stepIndex]}
          </Animated.Text>
          <Text style={[styles.stepHint, { color: colors.textMuted }]}>Creating 3 personalized messages...</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles (layout only — no colors) ────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 16, maxWidth: 640, alignSelf: 'center', width: '100%' },
  greeting: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8, marginTop: 8 },
  helper: { fontSize: 14, marginBottom: 28, lineHeight: 20 },
  section: { marginBottom: 20 },
  gap: { marginBottom: 12 },
  stickyBottom: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 8 : 16,
    paddingTop: 12,
    borderTopWidth: 1,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  btnOuter: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btn: { paddingVertical: 18, alignItems: 'center', borderRadius: 16 },
  btnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  loadingInner: { alignItems: 'center', paddingHorizontal: 32 },
  dots: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7B61FF' },
  stepText: { fontSize: 20, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  stepHint: { fontSize: 14, textAlign: 'center' },
});
