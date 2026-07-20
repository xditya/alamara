import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ExtractedField } from '@/types/models';

/**
 * A single label/value row for a document's extracted fields. Copyable fields
 * become tappable (PressableScale) and confirm with a toast.
 * Real clipboard is wired later — see the TODO below.
 */
export function FieldRow({ field }: { field: ExtractedField }) {
  const theme = useTheme();
  const toast = useToast();

  const body = (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <AppText variant="caption" color="textSecondary">
          {field.label}
        </AppText>
        <AppText variant={field.mono ? 'mono' : 'body'} style={styles.value}>
          {field.value}
        </AppText>
      </View>
      {field.copyable ? (
        <View style={[styles.copyChip, { backgroundColor: theme.backgroundElement }]}>
          <Icon name="copy" size={16} color="primary" />
        </View>
      ) : null}
    </View>
  );

  if (!field.copyable) return body;

  const onCopy = () => {
    // TODO(device): expo-clipboard — Clipboard.setStringAsync(field.value)
    toast.show('Copied ' + field.label);
  };

  return (
    <PressableScale onPress={onCopy} accessibilityRole="button" accessibilityLabel={'Copy ' + field.label}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  textCol: { flex: 1, gap: 2 },
  value: { marginTop: 1 },
  copyChip: {
    width: 36,
    height: 36,
    borderRadius: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
