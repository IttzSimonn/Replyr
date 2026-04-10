import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceHigh: string;
  border: string;
  text: string;
  textSec: string;
  textMuted: string;
  placeholder: string;
  inputBg: string;
  inputBorder: string;
  overlay: string;
  // accent is always the same but included for convenience
  accent: string;
  accentSecond: string;
}

export const DARK: ThemeColors = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceHigh: '#111827',
  border: '#334155',
  text: '#F1F5F9',
  textSec: '#94A3B8',
  textMuted: '#64748B',
  placeholder: '#475569',
  inputBg: '#1E293B',
  inputBorder: '#334155',
  overlay: 'rgba(15,23,42,0.94)',
  accent: '#7B61FF',
  accentSecond: '#5B9CFF',
};

export const LIGHT: ThemeColors = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceHigh: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textSec: '#64748B',
  textMuted: '#94A3B8',
  placeholder: '#94A3B8',
  inputBg: '#F1F5F9',
  inputBorder: '#CBD5E1',
  overlay: 'rgba(248,250,252,0.94)',
  accent: '#7B61FF',
  accentSecond: '#5B9CFF',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  colors: DARK,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const [flashColor, setFlashColor] = useState('#0F172A');
  const flashAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SecureStore.getItemAsync('theme').then((v) => {
      if (v === 'light') setIsDark(false);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    // Flash covers screen → switch theme → uncover to reveal new theme
    setFlashColor(next ? DARK.bg : LIGHT.bg);
    Animated.timing(flashAnim, { toValue: 1, duration: 130, useNativeDriver: true }).start(({ finished }) => {
      if (finished) {
        setIsDark(next);
        Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      }
    });
    await SecureStore.setItemAsync('theme', next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? DARK : LIGHT, toggleTheme }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: flashColor, opacity: flashAnim }]}
      />
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
