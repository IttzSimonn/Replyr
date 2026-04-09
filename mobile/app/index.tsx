import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync('onboarding_seen').then((v) => {
      setSeen(!!v);
      setReady(true);
    });
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#7B61FF" size="large" />
      </View>
    );
  }

  return <Redirect href={seen ? '/(tabs)' : '/onboarding'} />;
}
