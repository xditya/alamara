import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const theme = useTheme();
  const fg: Record<Tone, string> = {
    neutral: theme.textSecondary,
    primary: theme.primary,
    success: theme.success,
    warning: theme.warning,
    danger: theme.danger,
  };
  return (
    <AppText variant="label" style={[styles.badge, { backgroundColor: theme.backgroundElement, color: fg[tone] }]}>
      {label}
    </AppText>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    overflow: 'hidden',
    fontSize: 12,
  },
});
