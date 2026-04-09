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
import { clearHistory } from '../../services/history';

function Row({
  icon,
  label,
  value,
  onPress,
  danger,
  right,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !right}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {right ?? (onPress ? <Text style={styles.rowArrow}>›</Text> : null)}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        <View style={styles.userCard}>
          <LinearGradient
            colors={['#7B61FF', '#5B9CFF']}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.avatarText}>R</Text>
          </LinearGradient>
          <View>
            <Text style={styles.userName}>Guest User</Text>
            <Text style={styles.userEmail}>Not signed in</Text>
          </View>
        </View>

        {/* Plan */}
        <View style={styles.planCard}>
          <View style={styles.planLeft}>
            <Text style={styles.planLabel}>Current Plan</Text>
            <Text style={styles.planName}>Free</Text>
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
          <Text style={styles.sectionTitle}>PRO INCLUDES</Text>
          {['Unlimited generations', 'Priority AI model', 'Saved personas', 'Advanced analytics'].map(
            (f) => (
              <View key={f} style={styles.feature}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ),
          )}
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
          <View style={styles.card}>
            <Row
              icon="🌙"
              label="Dark Mode"
              right={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#334155', true: '#7B61FF' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
            <View style={styles.divider} />
            <Row
              icon="🔔"
              label="Notifications"
              right={
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{ false: '#334155', true: '#7B61FF' }}
                  thumbColor="#FFFFFF"
                />
              }
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>
          <View style={styles.card}>
            <Row icon="🔒" label="Privacy Policy" onPress={() => {}} />
            <View style={styles.divider} />
            <Row icon="📄" label="Terms of Service" onPress={() => {}} />
            <View style={styles.divider} />
            <Row icon="🗑" label="Clear All Data" onPress={handleClearData} danger />
            <View style={styles.divider} />
            <Row icon="🚪" label="Sign Out" onPress={handleLogout} danger />
          </View>
        </View>

        <Text style={styles.version}>Replyr v1.0.0 · Your data is private</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
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
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
  userName: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 2 },
  userEmail: { fontSize: 14, color: '#64748B' },
  planCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  planLeft: { marginBottom: 4 },
  planLabel: { fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  planName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  upgradeOuter: { borderRadius: 12, overflow: 'hidden' },
  upgradeBtn: { paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  upgradeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 2 },
  featureCheck: { color: '#7B61FF', fontSize: 14, fontWeight: '700' },
  featureText: { fontSize: 14, color: '#94A3B8' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  rowLabel: { flex: 1, fontSize: 15, color: '#F1F5F9', fontWeight: '500' },
  rowLabelDanger: { color: '#EF4444' },
  rowValue: { fontSize: 14, color: '#64748B' },
  rowArrow: { color: '#334155', fontSize: 18 },
  divider: { height: 1, backgroundColor: '#0F172A', marginLeft: 52 },
  version: { fontSize: 12, color: '#334155', textAlign: 'center', marginTop: 8 },
});
