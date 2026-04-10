import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    SecureStore.getItemAsync('onboarding_seen').then((seen) => {
      if (!seen) {
        router.replace('/onboarding');
      } else if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/auth');
      }
    });
  }, [loading, session]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color="#7B61FF" size="large" />
    </View>
  );
}
