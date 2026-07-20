import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AppText } from '@/components/ui/text';
import { Durations, Easings, StaggerMs } from '@/constants/motion';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';

/**
 * A titled, rounded grouped-list card (iOS-Settings style). Wraps a set of
 * SettingRow / SwitchRow children, drawing hairline dividers between them, and
 * fades itself in with a subtle staggered entry that honours reduce-motion.
 */
export function SettingGroup({
  title,
  footer,
  index = 0,
  children,
}: {
  title?: string;
  footer?: string;
  index?: number;
  children: ReactNode;
}) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const reduced = useReducedMotion();

  const delay = index * StaggerMs;
  const entering = reduced
    ? FadeIn.duration(Durations.enter).delay(delay)
    : FadeInDown.duration(Durations.enter).easing(Easings.out).delay(delay);

  const rows = Children.toArray(children).filter(Boolean);

  return (
    <Animated.View entering={entering} style={styles.wrap}>
      {title ? (
        <AppText variant="label" color="textSecondary" style={styles.title}>
          {title.toUpperCase()}
        </AppText>
      ) : null}

      <View
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
          CardShadow[scheme],
        ]}
      >
        {rows.map((child, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
            {child}
          </Fragment>
        ))}
      </View>

      {footer ? (
        <AppText variant="caption" color="textSecondary" style={styles.footer}>
          {footer}
        </AppText>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  title: { marginLeft: Spacing.base, letterSpacing: 0.4 },
  card: {
    borderRadius: Radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: Spacing.base },
  footer: { marginHorizontal: Spacing.base },
});
