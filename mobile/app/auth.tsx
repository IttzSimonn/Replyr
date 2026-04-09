import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

export default function AuthScreen() {
  const handleGuest = () => router.replace('/(tabs)');
  const handleSocial = () => router.replace('/(tabs)'); // UI only — routes to app

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={['#7B61FF', '#5B9CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <Text style={styles.logoEmoji}>✉️</Text>
          </LinearGradient>
          <Text style={styles.logoText}>Replyr</Text>
          <Text style={styles.tagline}>The fastest way to get replies</Text>
        </View>

        {/* Auth buttons */}
        <View style={styles.buttons}>
          {/* Apple */}
          <TouchableOpacity
            style={[styles.btn, styles.appleBtn]}
            onPress={handleSocial}
            activeOpacity={0.85}
          >
            <Text style={styles.appleIcon}>󰀵</Text>
            <Text style={styles.appleText}>Continue with Apple</Text>
          </TouchableOpacity>

          {/* Google */}
          <TouchableOpacity
            style={[styles.btn, styles.googleBtn]}
            onPress={handleSocial}
            activeOpacity={0.85}
          >
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={[styles.btn, styles.emailBtn]}
            onPress={handleSocial}
            activeOpacity={0.85}
          >
            <Text style={styles.emailIcon}>✉️</Text>
            <Text style={styles.emailText}>Continue with Email</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Guest */}
          <TouchableOpacity onPress={handleGuest} activeOpacity={0.7}>
            <Text style={styles.guestText}>Continue as guest</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>Fast login. No spam.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 40,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  logoWrap: { alignItems: 'center', marginTop: 40 },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#7B61FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoEmoji: { fontSize: 36 },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: { fontSize: 15, color: '#64748B', textAlign: 'center' },
  buttons: { width: '100%', gap: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  appleBtn: { backgroundColor: '#FFFFFF' },
  appleIcon: { fontSize: 18, color: '#000000' },
  appleText: { fontSize: 16, fontWeight: '600', color: '#000000' },
  googleBtn: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  googleG: { fontSize: 17, fontWeight: '700', color: '#4285F4' },
  googleText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  emailBtn: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  emailIcon: { fontSize: 16 },
  emailText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E293B' },
  dividerText: { color: '#475569', fontSize: 13 },
  guestText: { color: '#64748B', fontSize: 15, fontWeight: '500', textAlign: 'center' },
  legal: { color: '#334155', fontSize: 13, textAlign: 'center' },
});
