import { StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { FontFamily } from '@/constants/fonts';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search documents',
  onPressIn,
  editable = true,
  autoFocus,
}: {
  value?: string;
  onChangeText?: (t: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  onPressIn?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.backgroundElement }]}>
      <Icon name="search" size={18} color="textSecondary" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        onPressIn={onPressIn}
        editable={editable}
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
