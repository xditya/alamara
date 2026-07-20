import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export function Card({
  children,
  onPress,
  padded = true,
  style,
}: {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  const base: StyleProp<ViewStyle> = [
    {
      backgroundColor: theme.surface,
      borderRadius: Radius.card,
      borderWidth: 1,
      borderColor: theme.border,
      padding: padded ? Spacing.base : 0,
    },
    CardShadow[scheme],
    style,
  ];

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={base}>
        {children}
      </PressableScale>
    );
  }
  return <View style={base}>{children}</View>;
}
