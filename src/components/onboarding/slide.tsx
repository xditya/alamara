/**
 * Slide — the reusable layout for a single onboarding page: a big tinted circle
 * holding a themed Icon, a title, and a subtitle, all centered.
 *
 * When motion is allowed, the icon and text parallax at different rates against
 * the pager's `scrollX` (the circle travels further + scales, the copy trails),
 * and fade as the page leaves the viewport. Under reduce-motion the slide is
 * fully static. Transform + opacity only.
 */

import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';

export type SlideData = {
  icon: IconName;
  tint: string;
  fg: string;
  title: string;
  subtitle: string;
};

export function Slide({
  index,
  width,
  scrollX,
  reduced,
  icon,
  tint,
  fg,
  title,
  subtitle,
}: SlideData & {
  index: number;
  width: number;
  scrollX: SharedValue<number>;
  reduced: boolean;
}) {
  const iconStyle = useAnimatedStyle(() => {
    if (reduced) return {};
    const offset = scrollX.value - index * width;
    return {
      opacity: interpolate(
        offset,
        [-width * 0.7, 0, width * 0.7],
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: interpolate(
            offset,
            [-width, 0, width],
            [width * 0.5, 0, -width * 0.5],
            Extrapolation.CLAMP,
          ),
        },
        {
          scale: interpolate(offset, [-width, 0, width], [0.6, 1, 0.6], Extrapolation.CLAMP),
        },
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    if (reduced) return {};
    const offset = scrollX.value - index * width;
    return {
      opacity: interpolate(
        offset,
        [-width * 0.5, 0, width * 0.5],
        [0, 1, 0],
        Extrapolation.CLAMP,
      ),
      transform: [
        {
          translateX: interpolate(
            offset,
            [-width, 0, width],
            [width * 0.22, 0, -width * 0.22],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.circle, { backgroundColor: tint }, iconStyle]}>
        <Icon name={icon} size={72} color={fg} />
      </Animated.View>
      <Animated.View style={[styles.copy, textStyle]}>
        <AppText variant="title" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="body" color="textSecondary" style={styles.subtitle}>
          {subtitle}
        </AppText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.xxxl,
  },
  circle: {
    width: 176,
    height: 176,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { alignItems: 'center', gap: Spacing.md },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 320 },
});
