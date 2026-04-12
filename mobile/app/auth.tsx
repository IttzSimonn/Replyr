import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
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
  // WHY "blank localhost" appears:
  //   Supabase only honours the `redirectTo` URL when it is whitelisted under
  //   Authentication → URL Configuration → Redirect URLs in your project.
  //   If it isn't listed, Supabase falls back to the project's Site URL
  //   (default: http://localhost:3000) → Safari/Chrome shows a blank page.
  //
  // ONE-TIME SUPABASE DASHBOARD FIX:
  //   Add ALL of these to Authentication → URL Configuration → Redirect URLs:
  //     replyr://auth/callback                      ← standalone / dev build
  //     exp://localhost:8081/--/auth/callback        ← Expo Go on simulator
  //     exp://127.0.0.1:8081/--/auth/callback        ← alternate Expo Go form
  //
  // NOTE: Google OAuth won't return to Expo Go in some environments because
  //   Expo Go doesn't register the exp:// scheme globally on the device.
  //   Use `npx expo run:ios` (dev build) for the most reliable testing.

  const handleGoogle = async () => {
    try {
      setGoogleLoading(true);

      // Use the stable custom scheme — works in Expo Go too because
      // ASWebAuthenticationSession (iOS) intercepts the URL internally
      // without needing the OS to have replyr:// registered.
      const redirectTo = 'replyr://auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });

      if (error) throw error;
      if (!data.url) throw new Error('No OAuth URL returned from Supabase.');

      // ASWebAuthenticationSession (iOS) / Chrome Custom Tab (Android)
      // closes automatically when the browser navigates to `redirectTo`
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (result.type === 'success') {
        const url = result.url;

        // Detect "redirect URL not whitelisted" fallback — Supabase sent us
        // to localhost instead of back to the app.
        if (url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
          throw new Error(
            'Redirect URL not whitelisted in Supabase.\n\n' +
            'Go to: Supabase Dashboard → Authentication → URL Configuration → Redirect URLs\n' +
            `Add: ${redirectTo}`,
          );
        }

        // Parse both query-string (?code=X) and hash-fragment (#access_token=X) params
        const qIndex = url.indexOf('?');
        const hIndex = url.indexOf('#');
        const queryStr = qIndex !== -1 ? url.slice(qIndex + 1, hIndex !== -1 ? hIndex : undefined) : '';
        const hashStr = hIndex !== -1 ? url.slice(hIndex + 1) : '';
        const params: Record<string, string> = {};
        for (const seg of [...queryStr.split('&'), ...hashStr.split('&')]) {
          const eq = seg.indexOf('=');
          if (eq === -1) continue;
          params[decodeURIComponent(seg.slice(0, eq))] = decodeURIComponent(seg.slice(eq + 1));
        }

        // PKCE flow: exchange code for session (preferred)
        if (params.code) {
          const { error: exchErr } = await supabase.auth.exchangeCodeForSession(params.code);
          if (exchErr) throw exchErr;
          router.replace('/(tabs)');
          return;
        }

        // Implicit flow fallback: set session from tokens directly
        if (params.access_token) {
          const { error: sessErr } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token ?? '',
          });
          if (sessErr) throw sessErr;
          router.replace('/(tabs)');
          return;
        }

        throw new Error('Sign-in completed but no session was returned. Please try again.');
      }
      // result.type === 'cancel' | 'dismiss': user closed the browser — silent
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
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
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
  logoImage: {
    width: 90,
    height: 90,
    borderRadius: 22,
    marginBottom: 16,
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
