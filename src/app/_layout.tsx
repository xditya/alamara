import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastProvider } from '@/components/ui/toast';
import { FontAssets } from '@/constants/fonts';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { replace } from '@/lib/nav';
import { session } from '@/lib/session';
import { getPreferences, initPreferences } from '@/lib/theme-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const [loaded, error] = useFonts(FontAssets);
  const [prefsReady, setPrefsReady] = useState(false);
  const didGate = useRef(false);

  // Load persisted preferences (theme, onboarding, lock opt-in) before first paint.
  useEffect(() => {
    initPreferences().finally(() => setPrefsReady(true));
  }, []);

  const ready = (loaded || error) && prefsReady;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // One-shot launch gate: onboarding (first run ever) → biometric lock (if opted in) → app.
  useEffect(() => {
    if (!ready || didGate.current) return;
    didGate.current = true;
    const prefs = getPreferences();
    const id = setTimeout(() => {
      if (!prefs.onboarded) replace('/onboarding');
      else if (prefs.biometricLock && !session.unlocked) replace('/lock');
    }, 0);
    return () => clearTimeout(id);
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ToastProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
              <Stack.Screen name="lock" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
              <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal' }} />
            </Stack>
            <StatusBar style="auto" />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
