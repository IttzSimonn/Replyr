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
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../services/supabase';

// Required for OAuth redirect handling on iOS
WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const { colors } = useTheme();
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ─── Apple ────────────────────────────────────────────────────────────────

  const handleApple = async () => {
    try {
      setAppleLoading(true);

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('Apple did not return an identity token.');
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) throw error;

      router.replace('/(tabs)');
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert(
          'Apple Sign In Failed',
          e.message ?? 'Could not sign in with Apple. Please try again.',
        );
      }
    } finally {
      setAppleLoading(false);
    }
  };

  // ─── Google ───────────────────────────────────────────────────────────────
  // Note: Google OAuth requires a standalone build (not Expo Go) because it
  // relies on custom URL scheme redirects. Works fully after `eas build`.

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);

      // Build the redirect URI using the app's registered scheme
      const redirectTo = Linking.createURL('auth/callback');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned from Supabase.');

      // Open system browser for Google login
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        // Extract PKCE code from redirect URL
        const parsed = Linking.parse(result.url);
        const code = parsed.queryParams?.code as string | undefined;

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
          router.replace('/(tabs)');
        }
      }
    } catch (e: any) {
      Alert.alert(
        'Google Sign In Failed',
        e.message ?? 'Could not sign in with Google. Please try again.',
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // ─── Email / Guest ────────────────────────────────────────────────────────

  const handleEmail = () => router.push('/email-auth');

  const handleGuest = () => router.replace('/(tabs)');

  const anyLoading = appleLoading || googleLoading;

  // ─── Render ───────────────────────────────────────────────────────────────

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
          <Text style={[styles.tagline, { color: colors.textMuted }]}>
            The fastest way to get replies
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          {/* Apple */}
          <TouchableOpacity
            style={[styles.btn, styles.appleBtn]}
            onPress={handleApple}
            activeOpacity={0.85}
            disabled={anyLoading}
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
            style={[
              styles.btn,
              styles.outlineBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={handleGoogle}
            activeOpacity={0.85}
            disabled={anyLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={[styles.outlineBtnText, { color: colors.text }]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={[
              styles.btn,
              styles.outlineBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={handleEmail}
            activeOpacity={0.85}
            disabled={anyLoading}
          >
            <Ionicons name="mail-outline" size={20} color={colors.textSec} />
            <Text style={[styles.outlineBtnText, { color: colors.text }]}>
              Continue with Email
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>or</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Guest */}
          <TouchableOpacity onPress={handleGuest} activeOpacity={0.7} disabled={anyLoading}>
            <Text style={[styles.guestText, { color: colors.textMuted }]}>
              Continue as guest
            </Text>
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
  logoText: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
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
  outlineBtn: { borderWidth: 1 },
  outlineBtnText: { fontSize: 16, fontWeight: '600' },
  googleG: { fontSize: 17, fontWeight: '700', color: '#4285F4' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  guestText: { fontSize: 15, fontWeight: '500', textAlign: 'center' },
  legal: { fontSize: 13, textAlign: 'center' },
});
