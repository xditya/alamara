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
  KeyboardAvoidingView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PageDots } from '@/components/onboarding/page-dots';
import { Slide, type SlideData } from '@/components/onboarding/slide';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { replace } from '@/lib/nav';
import { getPreferences, setOnboarded, setUserName } from '@/lib/theme-store';
import { PressableScale } from '@/components/pressable-scale';
import * as biometric from '@/services/biometric';

/** Persist the onboarding flag, then enter the app (via the lock if opted in). */
function completeOnboarding() {
  setOnboarded(true);
  replace(getPreferences().biometricLock ? '/lock' : '/');
}

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cats = CategoryColors[scheme];
  const reduced = useReducedMotion();

  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'name'>('intro');
  const [name, setName] = useState('');
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
    const trimmed = name.trim();
    if (trimmed) setUserName(trimmed);
    // Warm up biometrics before handing off to the launch gate.
    await biometric.isAvailable();
    completeOnboarding();
  }, [name]);

  const onPrimary = useCallback(() => {
    if (isLast) {
      // Move from the intro slides to the "what's your name?" step.
      setPhase('name');
      return;
    }
    const next = index + 1;
    setIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: !reduced });
  }, [index, isLast, reduced, scrollRef, width]);

  // Final step: ask for a name to personalise the greeting (optional).
  if (phase === 'name') {
    const nameColor = cats.pan;
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Animated.View entering={reduced ? undefined : FadeIn.duration(260)} style={styles.nameBody}>
            <View style={[styles.nameIcon, { backgroundColor: nameColor.tint }]}>
              <Icon name="star" size={40} color={nameColor.fg} />
            </View>
            <AppText variant="title" style={styles.nameTitle}>
              What should we call you?
            </AppText>
            <AppText variant="body" color="textSecondary" style={styles.nameSub}>
              We&apos;ll use it to greet you. You can change or skip it — it stays on your device.
            </AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={theme.textSecondary}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              maxLength={40}
              onSubmitEditing={() => void finish()}
              style={[
                styles.nameInput,
                { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            />
          </Animated.View>
          <View style={styles.footer}>
            <Button title="Get started" icon="check" onPress={() => void finish()} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
        <Button title={isLast ? 'Continue' : 'Next'} icon="arrowRight" onPress={onPrimary} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
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
  // Name step
  nameBody: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.base },
  nameIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  nameTitle: { marginTop: Spacing.sm },
  nameSub: { marginBottom: Spacing.md },
  nameInput: {
    borderRadius: Radius.input,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    minHeight: 52,
    fontSize: 18,
  },
});
