import React, { createContext, useContext, useEffect, useState } from "react";
import { Stack, usePathname } from "expo-router";
import { View, Platform, useColorScheme, StyleSheet, ScrollView } from "react-native";
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Header } from "../src/components/v2/Header";
import { Footer } from "../src/components/v2/Footer";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tokens, LightThemeColors, DarkThemeColors } from "../src/theme/tokens";
// 🚀 Bulletproof Console Silencer for React 19 + React Native Web Incompatibilities
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const bugPhrases = [
    'onStartShouldSetResponder', 'onResponder', 'transform-origin', 'transformOrigin',
    'shadow*', 'pointerEvents', 'TouchableMixin', 'deprecated', 'Invalid DOM property',
    'Unknown event handler', 'react-native-svg', 'extra attributes', 'will be ignored', 'boxShadow'
  ];

  const createSilencer = (originalFunc: any) => (...args: any[]) => {
    const logString = args.map(a => String(a)).join(' ');
    if (bugPhrases.some(phrase => logString.includes(phrase))) return;
    return originalFunc(...args);
  };

  try {
    console.warn = createSilencer(console.warn);
    console.error = createSilencer(console.error);
  } catch (e) { }
}

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Tokens.colors.primary,
    secondary: Tokens.colors.secondary,
    background: LightThemeColors.background,
    surface: LightThemeColors.surface,
    surfaceVariant: LightThemeColors.surfaceVariant,
    onSurface: LightThemeColors.onSurface,
    onSurfaceVariant: LightThemeColors.onSurfaceVariant,
    outline: LightThemeColors.outline,
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: Tokens.colors.primary,
    secondary: Tokens.colors.secondary,
    background: DarkThemeColors.background,
    surface: DarkThemeColors.surface,
    surfaceVariant: DarkThemeColors.surfaceVariant,
    onSurface: DarkThemeColors.onSurface,
    onSurfaceVariant: DarkThemeColors.onSurfaceVariant,
    outline: DarkThemeColors.outline,
  },
};

import { initAuth } from "../src/services/api";

export const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => { },
});

export const useAppTheme = () => useContext(ThemeContext);

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');
  const [initialized, setInitialized] = useState(false);
  const pathname = usePathname();
  const isHideLayout = pathname === '/' ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/buyer') ||
    pathname.startsWith('/worker');

  useEffect(() => {
    const startup = async () => {
      await Promise.all([
        loadTheme(),
        initAuth()
      ]);
      setInitialized(true);
    };
    startup();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('user-theme');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (e) {
      console.error('Failed to load theme', e);
    }
  };

  if (!initialized) return null; // Or a splash screen

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('user-theme', newMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <PaperProvider theme={theme}>
        <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
          {isHideLayout ? (
            <Stack screenOptions={{ headerShown: false }} />
          ) : (
            <>
              <Header />
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={Platform.OS === 'web'}
              >
                <View style={styles.main}>
                  <Stack screenOptions={{ headerShown: false }} />
                </View>
                <Footer />
              </ScrollView>
            </>
          )}
        </View>
      </PaperProvider>
    </ThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  main: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    marginHorizontal: 'auto',
    alignSelf: 'center',
    padding: Platform.select({ web: 24, default: 0 }),
  }
});

