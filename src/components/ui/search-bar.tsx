import { StyleSheet, Text, TextInput, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { FontFamily } from '@/constants/fonts';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Search field with two modes:
 *
 * - **Button mode** (pass `onPress`): the whole pill is tappable and opens the search
 *   screen. It renders static text rather than a TextInput — a non-editable TextInput
 *   swallows touches on Android, which is why tapping used to do nothing.
 * - **Input mode** (default): a real editable field, used inside the search screen.
 */
export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search documents',
  onPress,
  autoFocus,
}: {
  value?: string;
  onChangeText?: (t: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  /** When set, the bar acts as a button (opens search) instead of an input. */
  onPress?: () => void;
  autoFocus?: boolean;
}) {
  const theme = useTheme();

  if (onPress) {
    return (
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={placeholder}
        style={[styles.wrap, { backgroundColor: theme.backgroundElement }]}
      >
        <Icon name="search" size={18} color="textSecondary" />
        <Text
          numberOfLines={1}
          style={[styles.input, { color: value ? theme.text : theme.textSecondary }]}
        >
          {value || placeholder}
        </Text>
      </PressableScale>
    );
  }

  return (
    <View style={[styles.wrap, { backgroundColor: theme.backgroundElement }]}>
      <Icon name="search" size={18} color="textSecondary" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={[styles.input, { color: theme.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.input,
    paddingHorizontal: Spacing.base,
    height: 48,
  },
  input: { flex: 1, fontFamily: FontFamily.medium, fontSize: 16 },
});
