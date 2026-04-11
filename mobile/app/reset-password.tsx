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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabase';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { clearRecoveryMode } = useAuth();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    let ok = true;
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      ok = false;
    } else {
      setPasswordError('');
    }
    if (password !== confirm) {
      setConfirmError('Passwords do not match');
      ok = false;
    } else {
      setConfirmError('');
    }
    return ok;
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      clearRecoveryMode();
      setSuccess(true);
    } catch (e: any) {
      const msg: string = e.message ?? 'Failed to update password.';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
        Alert.alert(
          'Link expired',
          'This reset link has expired. Please request a new one.',
          [{ text: 'OK', onPress: () => router.replace('/forgot-password') }],
        );
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
        <View style={styles.successContainer}>
          <LinearGradient
            colors={['#7B61FF', '#5B9CFF']}
            style={styles.successIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="checkmark" size={38} color="#FFFFFF" />
          </LinearGradient>

          <Text style={[styles.successTitle, { color: colors.text }]}>Password updated!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
            Your password has been changed. Sign in with your new password.
          </Text>

          <TouchableOpacity
            onPress={() => router.replace('/email-auth')}
            activeOpacity={0.85}
            style={styles.btnOuter}
          >
            <LinearGradient
              colors={['#7B61FF', '#5B9CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Sign in</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form screen ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={['#7B61FF', '#5B9CFF']}
              style={styles.headerIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="lock-open-outline" size={28} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>New password</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Choose a strong password for your account.
          </Text>

          <View style={styles.fields}>
            {/* New password */}
            <View>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: passwordError ? '#EF4444' : colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="New password"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setPasswordError(''); setConfirmError(''); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoFocus
                />
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
            </View>

            {/* Confirm password */}
            <View>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.inputBg,
                    borderColor: confirmError ? '#EF4444' : colors.inputBorder,
                  },
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.placeholder}
                  value={confirm}
                  onChangeText={(v) => { setConfirm(v); setConfirmError(''); }}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm((p) => !p)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
              {!!confirmError && <Text style={styles.fieldError}>{confirmError}</Text>}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleUpdate}
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
                <Text style={styles.btnText}>Update password</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
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
    paddingTop: 24,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  iconWrap: { marginBottom: 24 },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  eyeBtn: { padding: 2 },
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
  successContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
    gap: 14,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  successSubtitle: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
