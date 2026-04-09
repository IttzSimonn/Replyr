import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '../contexts/ThemeContext';

export default function AuthScreen() {
  const { colors } = useTheme();
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleApple = async () => {
    try {
      setAppleLoading(true);
      await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Failed', 'Apple Sign In failed. Please try again.');
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setGoogleLoading(false);
    router.replace('/(tabs)');
  };

  const handleEmail = () => {
    router.push('/email-auth');
  };

  const handleGuest = () => router.replace('/(tabs)');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoWrap}>
          <LinearGradient
            colors={['#7B61FF', '#5B9CFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoCircle}
          >
            <Ionicons name="mail" size={38} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.logoText, { color: colors.text }]}>Replyr</Text>
          <Text style={[styles.tagline, { color: colors.textMuted }]}>The fastest way to get replies</Text>
        </View>

        {/* Auth buttons */}
        <View style={styles.buttons}>
          {/* Apple */}
          <TouchableOpacity
            style={[styles.btn, styles.appleBtn]}
            onPress={handleApple}
            activeOpacity={0.85}
            disabled={appleLoading || googleLoading}
          >
            {appleLoading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={20} color="#000000" />
                <Text style={styles.appleText}>Continue with Apple</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Google */}
          <TouchableOpacity
            style={[styles.btn, styles.darkBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleGoogle}
            activeOpacity={0.85}
            disabled={appleLoading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={[styles.darkBtnText, { color: colors.text }]}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={[styles.btn, styles.darkBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleEmail}
            activeOpacity={0.85}
            disabled={appleLoading || googleLoading}
          >
            <Ionicons name="mail-outline" size={20} color={colors.textSec} />
            <Text style={[styles.darkBtnText, { color: colors.text }]}>Continue with Email</Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Guest */}
          <TouchableOpacity onPress={handleGuest} activeOpacity={0.7}>
            <Text style={[styles.guestText, { color: colors.textMuted }]}>Continue as guest</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.legal, { color: colors.border }]}>Fast login. No spam.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: { fontSize: 15, textAlign: 'center' },
  buttons: { width: '100%', gap: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    minHeight: 54,
  },
  appleBtn: { backgroundColor: '#FFFFFF' },
  appleText: { fontSize: 16, fontWeight: '600', color: '#000000' },
  darkBtn: { borderWidth: 1 },
  darkBtnText: { fontSize: 16, fontWeight: '600' },
  googleG: { fontSize: 17, fontWeight: '700', color: '#4285F4' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  guestText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  legal: { fontSize: 13, textAlign: 'center' },
});
