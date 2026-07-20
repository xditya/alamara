/**
 * CaptureOption — a large, tappable source card for the capture chooser.
 * A category-tinted icon tile + title/subtitle + chevron affordance.
 */

import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { CategoryColors, Radius, Spacing, type DocCategory } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export function CaptureOption({
  icon,
  title,
  subtitle,
  category,
  onPress,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  /** Drives the icon-tile tint (semantic per-category color). */
  category: DocCategory;
  onPress: () => void;
}) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = CategoryColors[scheme][category];

  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        <View style={[styles.tile, { backgroundColor: c.tint }]}>
          <Icon name={icon} size={26} color={c.fg} />
        </View>
        <View style={styles.text}>
          <AppText variant="section">{title}</AppText>
          <AppText variant="caption" color="textSecondary" style={styles.subtitle}>
            {subtitle}
          </AppText>
        </View>
        <Icon name="chevronRight" size={22} color={theme.textSecondary} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  tile: {
    width: 56,
    height: 56,
    borderRadius: Radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  subtitle: { marginTop: 2 },
});
