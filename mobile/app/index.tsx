import React, { useState, useRef, useEffect } from 'react';
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
import { generateDMs, DMContext } from '../services/anthropic';
import { setLastDMs, setLastContext } from '../services/store';

// ─── Constants ───────────────────────────────────────────────────────────────

const INTENTS = ['Sell', 'Collab', 'Network', 'Recruit', 'Other'];
const TONES = ['Confident', 'Friendly', 'Direct', 'Playful', 'Formal'];
const PLATFORMS = ['Instagram', 'LinkedIn', 'WhatsApp', 'Twitter/X', 'Email'];

const LOADING_STEPS = [
  'Analyzing your context...',
  'Finding the best angle...',
  'Crafting hooks...',
  'Writing your DMs...',
  'Polishing messages...',
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ChipRow({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <View style={chipStyles.row}>
      {options.map((opt) => {
        const active = selected === opt;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(active ? '' : opt)}
            activeOpacity={0.75}
            style={[chipStyles.chip, active && chipStyles.chipActive]}
          >
            {active && (
              <LinearGradient
                colors={['#7B61FF', '#5B9CFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Text style={[chipStyles.text, active && chipStyles.textActive]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function InputCard({
  icon,
  label,
  optional,
  placeholder,
  value,
  onChangeText,
  multiline,
}: {
  icon: string;
  label: string;
  optional?: boolean;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.icon}>{icon}</Text>
      <View style={cardStyles.body}>
        <Text style={cardStyles.label}>
          {label}
          {optional && <Text style={cardStyles.optional}> — optional</Text>}
        </Text>
        <TextInput
          style={[cardStyles.input, multiline && cardStyles.inputMulti]}
          placeholder={placeholder}
          placeholderTextColor="#334155"
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
  const [intent, setIntent] = useState('');
  const [target, setTarget] = useState('');
  const [goal, setGoal] = useState('');
  const [tone, setTone] = useState('');
  const [platform, setPlatform] = useState('');
  const [senderInfo, setSenderInfo] = useState('');
  const [targetContext, setTargetContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const heroOpacity = useRef(new Animated.Value(0)).current;
  const heroSlide = useRef(new Animated.Value(20)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const stepOpacity = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(heroSlide, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  // Fade in new step text whenever stepIndex changes
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

  const handleGenerate = async () => {
    if (!intent) { Alert.alert('Pick an intent', 'What is this DM for?'); return; }
    if (!target.trim()) { Alert.alert('Required', 'Who are you messaging?'); return; }
    if (!goal.trim()) { Alert.alert('Required', "What's your goal?"); return; }
    if (!tone) { Alert.alert('Pick a tone', 'How should these messages sound?'); return; }
    if (!platform) { Alert.alert('Pick a platform', 'Where are you sending this?'); return; }
    if (!senderInfo.trim()) { Alert.alert('Required', 'Add a bit about yourself.'); return; }

    const context: DMContext = { intent, target, goal, tone, platform, senderInfo, targetContext };

    setLoading(true);
    startCycling();
    Animated.timing(loadingOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start();

    try {
      setLastContext(context);
      const dms = await generateDMs(context);
      setLastDMs({ ...dms, platform });
      router.push('/results');
    } catch (err: any) {
      Alert.alert('Something went wrong', err.message ?? 'Failed to generate. Please try again.');
    } finally {
      stopCycling();
      Animated.timing(loadingOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        () => setLoading(false),
      );
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <Animated.View
            style={{ opacity: heroOpacity, transform: [{ translateY: heroSlide }] }}
          >
            <Text style={styles.title}>Replyr</Text>
            <Text style={styles.subtitle}>Generate DMs that actually get replies</Text>
          </Animated.View>

          {/* Intent */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INTENT</Text>
            <ChipRow options={INTENTS} selected={intent} onSelect={setIntent} />
          </View>

          <View style={styles.gap}>
            <InputCard
              icon="👤"
              label="Target Person"
              placeholder="Who are you messaging?"
              value={target}
              onChangeText={setTarget}
            />
          </View>

          <View style={styles.gap}>
            <InputCard
              icon="🎯"
              label="Goal"
              placeholder="What do you want to happen?"
              value={goal}
              onChangeText={setGoal}
            />
          </View>

          {/* Tone */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TONE</Text>
            <ChipRow options={TONES} selected={tone} onSelect={setTone} />
          </View>

          {/* Platform */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>PLATFORM</Text>
            <ChipRow options={PLATFORMS} selected={platform} onSelect={setPlatform} />
          </View>

          <View style={styles.gap}>
            <InputCard
              icon="💼"
              label="About You"
              placeholder="Brief info about you or your offer"
              value={senderInfo}
              onChangeText={setSenderInfo}
            />
          </View>

          <View style={styles.gap}>
            <InputCard
              icon="💡"
              label="Target Context"
              optional
              placeholder="Their posts, business, vibe... anything relevant"
              value={targetContext}
              onChangeText={setTargetContext}
              multiline
            />
          </View>

          {/* Generate button */}
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
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading overlay */}
      <Animated.View
        style={[styles.overlay, { opacity: loadingOpacity }]}
        pointerEvents={loading ? 'auto' : 'none'}
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
          <Text style={styles.stepHint}>Creating 3 personalized messages...</Text>
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#1E293B',
    overflow: 'hidden',
  },
  chipActive: { borderColor: 'transparent' },
  text: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  textActive: { color: '#FFFFFF', fontWeight: '600' },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  icon: { fontSize: 20, marginTop: 1 },
  body: { flex: 1 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  optional: { fontWeight: '400', color: '#475569', textTransform: 'none', letterSpacing: 0 },
  input: { fontSize: 15, color: '#F1F5F9', padding: 0 },
  inputMulti: { minHeight: 72 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 60,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 36,
    lineHeight: 24,
  },
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  gap: { marginBottom: 12 },
  btnOuter: {
    marginTop: 28,
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
