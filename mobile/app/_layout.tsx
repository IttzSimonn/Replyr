import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1A1A2E',
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#F5F7FA' },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'Replyr',
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen name="results" options={{ title: 'Your DMs' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}
