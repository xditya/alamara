/** Section title with an optional right-aligned "See all" affordance. */

import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="section">{title}</AppText>
      {actionLabel && onAction ? (
        <PressableScale onPress={onAction} style={styles.action} hitSlop={8}>
          <AppText variant="label" color="primary">
            {actionLabel}
          </AppText>
          <Icon name="chevronRight" size={16} color="primary" />
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
