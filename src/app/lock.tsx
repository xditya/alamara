/**
 * Lock — the biometric app-lock gate.
 *
 * Centered Alamara wordmark, a lock Icon in a tinted circle, a subtitle, and an
 * "Unlock" Button that runs `biometric.authenticate()`; on success it enters the
 * app, on failure it toasts. Authentication is auto-triggered once on mount. The
 * lock icon pops in on entrance (transform + opacity), and collapses to instant
 * under reduce-motion.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Durations, Easings, Springs } from '@/constants/motion';
import { CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { replace } from '@/lib/nav';
import { session } from '@/lib/session';
import * as biometric from '@/services/biometric';

export default function LockScreen() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const lockColor = CategoryColors[scheme].id;
  const reduced = useReducedMotion();
  const toast = useToast();

  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  const scale = useSharedValue(reduced ? 1 : 0.82);
  const opacity = useSharedValue(reduced ? 1 : 0);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      scale.value = 1;
      return;
    }
    opacity.value = withTiming(1, { duration: Durations.enter, easing: Easings.out });
    scale.value = withSpring(1, Springs.gentle);
  }, [opacity, reduced, scale]);

  const unlock = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      const ok = await biometric.authenticate();
      if (ok) {
        session.unlocked = true;
        replace('/');
        return;
      }
      toast.show('Authentication failed');
    } catch {
      toast.show('Authentication failed');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [toast]);

  // Auto-trigger biometrics once on mount.
  useEffect(() => {
    void unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <AppText variant="title">Alamara</AppText>
        <Animated.View style={[styles.circle, { backgroundColor: lockColor.tint }, iconStyle]}>
          <Icon name="lock" size={56} color={lockColor.fg} />
        </Animated.View>
        <AppText variant="body" color="textSecondary" style={styles.subtitle}>
          Unlock Alamara
        </AppText>
      </View>

      <View style={styles.footer}>
        <Button title="Unlock" icon="lock" onPress={unlock} loading={busy} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  circle: {
    width: 132,
    height: 132,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.base },
});
