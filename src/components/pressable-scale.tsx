/**
 * PressableScale — the app's base tappable primitive.
 * Presses in to `scale 0.97` and springs back (Emil's "buttons must feel
 * responsive"). Honors reduce-motion by skipping the scale entirely.
 */

import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Springs } from '@/constants/motion';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  /** Scale applied while pressed. Defaults to 0.97. */
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
};

export function PressableScale({
  scaleTo = 0.97,
  style,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPressIn={(e) => {
        if (!reduced) scale.value = withSpring(scaleTo, Springs.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, Springs.snappy);
        onPressOut?.(e);
      }}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </AnimatedPressable>
  );
}
