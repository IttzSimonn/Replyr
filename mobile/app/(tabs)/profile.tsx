import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { clearHistory } from '../../services/history';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function Row({
  icon,
  label,
  value,
  onPress,
  danger,
  right,
}: {
  icon: IoniconsName;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !right}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? '#EF4444' : colors.textMuted}
        style={{ width: 24 }}
      />
      <Text style={[styles.rowLabel, { color: danger ? '#EF4444' : colors.text }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: colors.textMuted }]}>{value}</Text> : null}
      {right ?? (onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.border} />
      ) : null)}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(false);

  // Derive display name: prefer full_name from metadata, then email prefix
  const displayName = user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? (user?.email ? user.email.split('@')[0] : null)
    ?? 'Guest User';

  const displayEmail = user?.email ?? 'Not signed in';

  // Avatar initial — first letter of display name
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          await SecureStore.deleteItemAsync('onboarding_seen');
          router.replace('/onboarding');
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert('Clear All Data', 'This will delete your entire history. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearHistory();
          Alert.alert('Done', 'All data cleared.');
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <LinearGradient
            colors={['#7B61FF', '#5B9CFF']}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </LinearGradient>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={[styles.userEmail, { color: colors.textMuted }]} numberOfLines={1}>
              {displayEmail}
            </Text>
          </View>
        </View>

        {/* Plan */}
        <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.planLeft}>
            <Text style={[styles.planLabel, { color: colors.textMuted }]}>Current Plan</Text>
            <Text style={[styles.planName, { color: colors.text }]}>Free</Text>
          </View>
          <TouchableOpacity activeOpacity={0.85} style={styles.upgradeOuter}>
            <LinearGradient
              colors={['#7B61FF', '#5B9CFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeBtn}
            >
              <Text style={styles.upgradeBtnText}>Upgrade to Pro ✨</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Pro features */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PRO INCLUDES</Text>
          {['Unlimited generations', 'Priority AI model', 'Saved personas', 'Advanced analytics'].map(
            (f) => (
              <View key={f} style={styles.feature}>
                <Ionicons name="checkmark" size={14} color="#7B61FF" />
                <Text style={[styles.featureText, { color: colors.textSec }]}>{f}</Text>
              </View>
            ),
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SETTINGS</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Row
              icon="moon-outline"
              label="Dark Mode"
              right={
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: colors.border, true: '#7B61FF' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <View style={[styles.divider, { backgroundColor: colors.bg, marginLeft: 52 }]} />
            <Row
              icon="notifications-outline"
              label="Notifications"
              right={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: colors.border, true: '#7B61FF' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACCOUNT</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Row
              icon="lock-closed-outline"
              label="Privacy Policy"
              onPress={() => router.push('/privacy')}
            />
            <View style={[styles.divider, { backgroundColor: colors.bg, marginLeft: 52 }]} />
            <Row
              icon="document-text-outline"
              label="Terms of Service"
              onPress={() => router.push('/terms')}
            />
            <View style={[styles.divider, { backgroundColor: colors.bg, marginLeft: 52 }]} />
            <Row icon="trash-outline" label="Clear All Data" onPress={handleClearData} danger />
            <View style={[styles.divider, { backgroundColor: colors.bg, marginLeft: 52 }]} />
            <Row icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
          </View>
        </View>

        <Text style={[styles.version, { color: colors.border }]}>Replyr v1.0.0 · Your data is private</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  userInfo: { flex: 1, minWidth: 0 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  userName: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  userEmail: { fontSize: 14 },
  planCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  planLeft: { marginBottom: 4 },
  planLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  planName: { fontSize: 20, fontWeight: '800' },
  upgradeOuter: { borderRadius: 12, overflow: 'hidden' },
  upgradeBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  upgradeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  featureText: { fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  rowValue: { fontSize: 14 },
  divider: { height: 1 },
  version: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
