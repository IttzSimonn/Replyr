import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceHigh: string;
  border: string;
  text: string;
  textSec: string;
  textMuted: string;
  inputBg: string;
  inputBorder: string;
  overlay: string;
}

const DARK: ThemeColors = {
  bg: '#0F172A',
  surface: '#1E293B',
  surfaceHigh: '#111827',
  border: '#334155',
  text: '#FFFFFF',
  textSec: '#94A3B8',
  textMuted: '#475569',
  inputBg: '#1E293B',
  inputBorder: '#334155',
  overlay: 'rgba(15,23,42,0.93)',
};

const LIGHT: ThemeColors = {
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceHigh: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textSec: '#64748B',
  textMuted: '#94A3B8',
  inputBg: '#F1F5F9',
  inputBorder: '#CBD5E1',
  overlay: 'rgba(248,250,252,0.93)',
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

  useEffect(() => {
    SecureStore.getItemAsync('theme').then((v) => {
      if (v === 'light') setIsDark(false);
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await SecureStore.setItemAsync('theme', next ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ isDark, colors: isDark ? DARK : LIGHT, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
