import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FloatingCaptureButton } from '@/components/floating-capture-button';
import { ToastProvider } from '@/components/ui/toast';
import { FontAssets } from '@/constants/fonts';
import { replace } from '@/lib/nav';
import { session } from '@/lib/session';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const scheme = useColorScheme();
  const [loaded, error] = useFonts(FontAssets);
  const didGate = useRef(false);

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // One-shot launch gate: onboarding (first run this session) → biometric lock → app.
  useEffect(() => {
    if ((!loaded && !error) || didGate.current) return;
    didGate.current = true;
    const id = setTimeout(() => {
      if (!session.onboarded) replace('/onboarding');
      else if (!session.unlocked) replace('/lock');
    }, 0);
    return () => clearTimeout(id);
  }, [loaded, error]);

  if (!loaded && !error) return null;

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
            <FloatingCaptureButton />
            <StatusBar style="auto" />
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
