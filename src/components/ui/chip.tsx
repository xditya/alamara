import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { CategoryColors, Radius, Spacing, type DocCategory } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export function Chip({
  label,
  active,
  onPress,
  category,
  icon,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  category?: DocCategory;
  icon?: IconName;
}) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const cat = category ? CategoryColors[scheme][category] : undefined;

  const bg = active ? cat?.tint ?? theme.primaryMuted : theme.backgroundElement;
  const fg = active ? cat?.fg ?? theme.primary : theme.textSecondary;

  return (
    <PressableScale onPress={onPress} style={[styles.chip, { backgroundColor: bg }]}>
      <View style={styles.row}>
        {icon ? <Icon name={icon} size={15} color={fg} /> : null}
        <AppText variant="label" style={{ color: fg }}>
          {label}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: Radius.pill, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
