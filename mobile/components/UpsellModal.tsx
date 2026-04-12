import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** 'soft' = gentle nudge after 2nd gen, 'hard' = limit reached */
  variant?: 'soft' | 'hard';
}

export default function UpsellModal({ visible, onClose, variant = 'soft' }: Props) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const isHard = variant === 'hard';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={isHard ? undefined : onClose}>
      <Pressable style={styles.bg} onPress={isHard ? undefined : onClose}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <Text style={styles.emoji}>{isHard ? '🔒' : '✨'}</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {isHard ? "You've used your free messages" : 'Want unlimited messages?'}
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {isHard
              ? 'Upgrade to Pro for unlimited DMs, priority AI, and saved personas.'
              : 'Upgrade to Pro for unlimited daily DMs, priority AI, and saved personas.'}
          </Text>

          <TouchableOpacity
            onPress={() => { onClose(); router.push('/(tabs)/profile'); }}
            activeOpacity={0.85}
            style={styles.btnOuter}
          >
            <LinearGradient
              colors={['#7B61FF', '#5B9CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Unlock Pro</Text>
            </LinearGradient>
          </TouchableOpacity>

          {!isHard && (
            <TouchableOpacity onPress={onClose} style={styles.skip} activeOpacity={0.6}>
              <Text style={[styles.skipText, { color: colors.textMuted }]}>Maybe later</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
  },
  emoji: { fontSize: 36, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  btnOuter: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  btn: { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  skip: { paddingVertical: 8 },
  skipText: { fontSize: 14 },
});
