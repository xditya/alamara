/**
 * Onboarding — a 3-slide first-run intro.
 *
 * A horizontal, paging ScrollView of `Slide`s with parallax + animated page
 * dots (both driven by a shared `scrollX`). The bottom Button advances the
 * pager, and on the final slide warms up biometrics via `isAvailable()` before
 * entering the app. A "Skip" affordance jumps straight in. All motion honors
 * reduce-motion (parallax collapses to plain paging; programmatic scroll and
 * the icon pop become instant).
 */

import { useCallback, useRef, useState } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageDots } from '@/components/onboarding/page-dots';
import { Slide, type SlideData } from '@/components/onboarding/slide';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { CategoryColors, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { replace } from '@/lib/nav';
import { getPreferences, setOnboarded } from '@/lib/theme-store';
import { PressableScale } from '@/components/pressable-scale';
import * as biometric from '@/services/biometric';

/** Persist the onboarding flag, then enter the app (via the lock if opted in). */
function completeOnboarding() {
  setOnboarded(true);
  replace(getPreferences().biometricLock ? '/lock' : '/');
}

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cats = CategoryColors[scheme];
  const reduced = useReducedMotion();

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const busy = useRef(false);

  const slides: SlideData[] = [
    {
      icon: 'folder',
      tint: cats.id.tint,
      fg: cats.id.fg,
      title: 'Every document, one place',
      subtitle: 'Aadhaar, PAN, tickets and IDs — organised, searchable, always at hand.',
    },
    {
      icon: 'scan',
      tint: cats.ticket.tint,
      fg: cats.ticket.fg,
      title: 'Scan, share, or import',
      subtitle: 'Capture any document and it is read, named and indexed instantly.',
    },
    {
      icon: 'shield',
      tint: cats.aadhaar.tint,
      fg: cats.aadhaar.fg,
      title: 'Private by design',
      subtitle: 'Encrypted on your device. Nothing ever leaves your phone.',
    },
  ];

  const last = slides.length - 1;
  const isLast = index >= last;

  const scrollHandler = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  const finish = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    // Warm up biometrics before handing off to the launch gate.
    await biometric.isAvailable();
    completeOnboarding();
  }, []);

  const onPrimary = useCallback(() => {
    if (isLast) {
      void finish();
      return;
    }
    const next = index + 1;
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: !reduced });
  }, [finish, index, isLast, reduced, scrollRef, width]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.skipRow}>
        {isLast ? null : (
          <PressableScale
            onPress={completeOnboarding}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            style={styles.skip}
          >
            <AppText variant="label" color="textSecondary">
              Skip
            </AppText>
          </PressableScale>
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumEnd}
        style={styles.pager}
      >
        {slides.map((slide, i) => (
          <Slide
            key={i}
            {...slide}
            index={i}
            width={width}
            scrollX={scrollX}
            reduced={reduced}
          />
        ))}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <PageDots count={slides.length} scrollX={scrollX} width={width} />
        <Button
          title={isLast ? 'Get started' : 'Next'}
          icon={isLast ? 'check' : 'arrowRight'}
          onPress={onPrimary}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  skipRow: {
    height: 44,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  skip: { minWidth: 44, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  pager: { flex: 1 },
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.base, gap: Spacing.xl },
});
