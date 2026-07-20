import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SettingRowProps = {
  /** Leading icon (rendered inside a rounded tinted square). */
  icon?: IconName;
  /** Background of the icon square. Defaults to the primary-muted token. */
  iconTint?: string;
  /** Icon colour. Defaults to the primary token. */
  iconColor?: string;
  label: string;
  subtitle?: string;
  /** Right-aligned secondary value text. */
  value?: string;
  onPress?: () => void;
  /** Show a trailing chevron. Defaults to true when `onPress` is set. */
  showChevron?: boolean;
  /** Show a trailing check (selectable-option rows) instead of a chevron. */
  selected?: boolean;
  /** Render the label in the danger tone. */
  destructive?: boolean;
  /** Custom trailing slot (overrides value/chevron/check). */
  right?: ReactNode;
};

export function SettingRow({
  icon,
  iconTint,
  iconColor,
  label,
  subtitle,
  value,
  onPress,
  showChevron,
  selected,
  destructive,
  right,
}: SettingRowProps) {
  const theme = useTheme();
  const chevron = showChevron ?? Boolean(onPress);

  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.iconWrap, { backgroundColor: iconTint ?? theme.primaryMuted }]}>
          <Icon name={icon} size={17} color={iconColor ?? theme.primary} />
        </View>
      ) : null}

      <View style={styles.labels}>
        <AppText variant="body" color={destructive ? 'danger' : 'text'} numberOfLines={1}>
          {label}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary">
            {subtitle}
          </AppText>
        ) : null}
      </View>

      <View style={styles.trailing}>
        {right ?? (
          <>
            {value ? (
              <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.value}>
                {value}
              </AppText>
            ) : null}
            {selected ? (
              <Icon name="check" size={18} color={theme.primary} />
            ) : chevron ? (
              <Icon name="chevronRight" size={18} color={theme.textSecondary} />
            ) : null}
          </>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={styles.press}>
        {content}
      </PressableScale>
    );
  }
  return <View style={styles.press}>{content}</View>;
}

const styles = StyleSheet.create({
  press: { paddingHorizontal: Spacing.base },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: { flex: 1, gap: 2 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 0 },
  value: { maxWidth: 160, textAlign: 'right' },
});
