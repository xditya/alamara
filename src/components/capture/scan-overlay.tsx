/**
 * ScanOverlay — the animated framing overlay for the (mocked) document scanner.
 * Draws four corner brackets around a document-shaped frame plus a sweeping
 * scan-line. Motion honors `useReducedMotion()` (line parks mid-frame, no sweep).
 *
 * Rendered on the intentionally-dark full-screen `scan` surface, so it uses the
 * theme `primary` accent over the dark viewfinder rather than light/dark tokens.
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';

export function ScanOverlay() {
  const reduced = useReducedMotion();
  const theme = useTheme();
  const accent = theme.primary;

  const progress = useSharedValue(0);
  const frameH = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = 0.5;
      return;
    }
    progress.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(progress);
  }, [reduced, progress]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [0, Math.max(frameH.value - 2, 0)]) }],
    opacity: reduced ? 0.5 : interpolate(progress.value, [0, 0.08, 0.92, 1], [0, 1, 1, 0]),
  }));

  const corner = [styles.corner, { borderColor: accent }];

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View
        style={styles.frame}
        onLayout={(e) => {
          frameH.value = e.nativeEvent.layout.height;
        }}
      >
        <View style={[corner, styles.tl]} />
        <View style={[corner, styles.tr]} />
        <View style={[corner, styles.bl]} />
        <View style={[corner, styles.br]} />
        <Animated.View
          style={[styles.line, { backgroundColor: accent, shadowColor: accent }, lineStyle]}
        />
      </View>
    </View>
  );
}

const BRACKET = 34;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  frame: { width: '76%', aspectRatio: 0.66, maxWidth: 340 },
  corner: { position: 'absolute', width: BRACKET, height: BRACKET },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 14 },
  line: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 0,
    height: 2,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
});
