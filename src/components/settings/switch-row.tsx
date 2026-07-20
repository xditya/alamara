import { StyleSheet, Switch, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SwitchRow({
  icon,
  iconTint,
  iconColor,
  label,
  subtitle,
  value,
  onValueChange,
  disabled,
}: {
  icon?: IconName;
  iconTint?: string;
  iconColor?: string;
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.row, disabled && styles.disabled]}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconTint ?? theme.primaryMuted }]}>
          <Icon name={icon} size={17} color={iconColor ?? theme.primary} />
        </View>
      ) : null}

      <View style={styles.labels}>
        <AppText variant="body" numberOfLines={1}>
          {label}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor={theme.surfaceElevated}
        ios_backgroundColor={theme.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
    paddingHorizontal: Spacing.base,
  },
  disabled: { opacity: 0.5 },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: { flex: 1, gap: 2 },
});
