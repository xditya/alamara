import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.iconWrap, { backgroundColor: theme.backgroundElement }]}>
        <Icon name={icon} size={28} color="textSecondary" />
      </View>
      <AppText variant="section" style={styles.center}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" color="textSecondary" style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="secondary" style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl },
  iconWrap: { width: 64, height: 64, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  action: { marginTop: Spacing.sm, paddingHorizontal: Spacing.xl },
});
