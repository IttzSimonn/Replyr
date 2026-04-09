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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EmailAuthScreen() {
  const { colors } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validate = () => {
    let ok = true;
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address');
      ok = false;
    } else {
      setEmailError('');
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      ok = false;
    } else {
      setPasswordError('');
    }
    return ok;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Simulate auth delay — replace with real auth backend
      await new Promise((r) => setTimeout(r, 1600));
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Sign In Failed', 'Something went wrong. Please try again.');
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

          {/* Header */}
          <Text style={[styles.title, { color: colors.text }]}>
            {isLogin ? 'Welcome back' : 'Create account'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {isLogin ? 'Sign in to your Replyr account' : 'Start generating replies for free'}
          </Text>

          {/* Fields */}
          <View style={styles.fields}>
            <View>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.inputBg, borderColor: emailError ? '#EF4444' : colors.inputBorder },
                ]}
              >
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Email address"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setEmailError(''); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
              {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}
            </View>

            <View>
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: colors.inputBg, borderColor: passwordError ? '#EF4444' : colors.inputBorder },
                ]}
              >
                <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setPasswordError(''); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
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
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
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
                <Text style={styles.btnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Toggle */}
          <TouchableOpacity
            onPress={() => { setIsLogin((v) => !v); setEmailError(''); setPasswordError(''); }}
            style={styles.toggle}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, { color: colors.textMuted }]}>
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
            </Text>
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
    marginBottom: 20,
  },
  btn: { paddingVertical: 17, alignItems: 'center', borderRadius: 14 },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  toggle: { alignItems: 'center' },
  toggleText: { fontSize: 14 },
  toggleLink: { color: '#7B61FF', fontWeight: '600' },
});
