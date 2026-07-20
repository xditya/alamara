import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  size = 'md',
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  const bg =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? theme.danger
        : variant === 'secondary'
          ? theme.backgroundElement
          : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger'
      ? theme.onPrimary
      : variant === 'ghost'
        ? theme.primary
        : theme.text;
  const padV = size === 'sm' ? Spacing.sm : size === 'lg' ? Spacing.base : Spacing.md;

  return (
    <PressableScale
      onPress={disabled || loading ? undefined : onPress}
      style={[styles.base, { backgroundColor: bg, paddingVertical: padV, opacity: disabled ? 0.5 : 1 }, style]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={18} color={fg} /> : null}
            <AppText variant="label" style={{ color: fg, fontSize: 15 }}>
              {title}
            </AppText>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
