/**
 * PageDots — animated pagination indicator for the onboarding pager.
 * The dot nearest the current scroll position scales up and reaches full
 * opacity; neighbours fade back. Driven by the pager's `scrollX` shared value
 * so it tracks the drag gesture frame-for-frame (transform + opacity only).
 */

import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function PageDots({
  count,
  scrollX,
  width,
}: {
  count: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} index={i} scrollX={scrollX} width={width} />
      ))}
    </View>
  );
}

function Dot({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
}) {
  const theme = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const page = width > 0 ? scrollX.value / width : 0;
    const distance = Math.abs(page - index);
    const active = interpolate(distance, [0, 1], [1, 0], Extrapolation.CLAMP);
    return {
      opacity: 0.28 + 0.72 * active,
      transform: [{ scale: 1 + 0.9 * active }],
    };
  });

  return <Animated.View style={[styles.dot, { backgroundColor: theme.primary }, animatedStyle]} />;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 999 },
});
