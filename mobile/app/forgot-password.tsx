import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setEmailError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'replyr://reset-password',
      });
      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      setEmailError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={22} color={colors.textSec} />
          </TouchableOpacity>

          {sent ? (
            /* ── Success state ─────────────────────────────────────────────── */
            <View style={styles.successWrap}>
              <LinearGradient
                colors={['#7B61FF', '#5B9CFF']}
                style={styles.successIcon}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="mail" size={32} color="#FFFFFF" />
              </LinearGradient>

              <Text style={[styles.title, { color: colors.text, textAlign: 'center' }]}>
                Check your inbox
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: 'center' }]}>
                We sent a reset link to{'\n'}
                <Text style={{ color: colors.text, fontWeight: '600' }}>{email}</Text>
              </Text>
              <Text style={[styles.hint, { color: colors.textMuted }]}>
                Tap the link in the email to set a new password. Don't forget to check spam.
              </Text>

              <TouchableOpacity
                onPress={() => router.replace('/auth')}
                activeOpacity={0.7}
                style={styles.backToLogin}
              >
                <Text style={[styles.backToLoginText, { color: colors.accent }]}>
                  Back to sign in
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Form state ────────────────────────────────────────────────── */
            <>
              <Text style={[styles.title, { color: colors.text }]}>Reset password</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Enter your email and we'll send you a reset link.
              </Text>

              <View style={styles.fields}>
                <View>
                  <View
                    style={[
                      styles.inputWrap,
                      {
                        backgroundColor: colors.inputBg,
                        borderColor: emailError ? '#EF4444' : colors.inputBorder,
                      },
                    ]}
                  >
                    <Ionicons
                      name="mail-outline"
                      size={18}
                      color={colors.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Email address"
                      placeholderTextColor={colors.placeholder}
                      value={email}
                      onChangeText={(v) => { setEmail(v); setEmailError(''); }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      autoFocus
                    />
                  </View>
                  {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.btnOuter, loading && { opacity: 0.6 }]}
              >
                <LinearGradient
                  colors={['#7B61FF', '#5B9CFF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btn}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.btnText}>Send reset link</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  back: { marginBottom: 32, width: 40 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 15, marginBottom: 32, lineHeight: 22 },
  fields: { gap: 12, marginBottom: 20 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inputIcon: { width: 20 },
  input: { flex: 1, fontSize: 15, padding: 0 },
  fieldError: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  btnOuter: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btn: { paddingVertical: 17, alignItems: 'center', borderRadius: 14 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  // Success state
  successWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
    gap: 12,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  hint: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginHorizontal: 8 },
  backToLogin: { marginTop: 24 },
  backToLoginText: { fontSize: 15, fontWeight: '600' },
});
