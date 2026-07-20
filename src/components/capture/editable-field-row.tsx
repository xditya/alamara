/**
 * EditableFieldRow — an extracted field rendered as a labelled, editable input
 * with an optional remove affordance. Used on the Review & confirm screen.
 */

import { StyleSheet, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function EditableFieldRow({
  label,
  value,
  mono,
  onChangeValue,
  onRemove,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onChangeValue: (v: string) => void;
  onRemove?: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <AppText variant="label" color="textSecondary">
          {label}
        </AppText>
        {onRemove ? (
          <PressableScale onPress={onRemove} style={styles.remove} hitSlop={8}>
            <Icon name="trash" size={16} color={theme.textSecondary} />
          </PressableScale>
        ) : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeValue}
        placeholder="—"
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            fontFamily: mono ? Fonts?.mono : Fonts?.sans,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remove: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
  },
  input: {
    borderRadius: Radius.input,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    minHeight: 48,
    fontSize: 16,
  },
});
