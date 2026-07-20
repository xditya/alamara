/** "Browse by category" — a grid of tinted tiles, each opening the Documents library. */

import { StyleSheet, View } from 'react-native';

import { CATEGORY_ICONS } from '@/components/home/category-icons';
import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { CardShadow, CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { go } from '@/lib/nav';
import { CATEGORY_LABELS, type DocCategory, type Document } from '@/types/models';

const ORDER: DocCategory[] = ['aadhaar', 'pan', 'id', 'ticket', 'certificate', 'other'];

export function CategoryGrid({ documents }: { documents: Document[] }) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  const counts = documents.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <View style={styles.grid}>
      {ORDER.map((cat) => {
        const c = CategoryColors[scheme][cat];
        const n = counts[cat] ?? 0;
        return (
          <PressableScale key={cat} onPress={() => go('/documents')} style={styles.tileWrap}>
            <View style={[styles.tile, { backgroundColor: theme.surface, borderColor: theme.border }, CardShadow[scheme]]}>
              <View style={[styles.iconWrap, { backgroundColor: c.tint }]}>
                <Icon name={CATEGORY_ICONS[cat]} size={20} color={c.fg} />
              </View>
              <AppText variant="label" numberOfLines={1}>
                {CATEGORY_LABELS[cat]}
              </AppText>
              <AppText variant="caption" color="textSecondary">
                {n} {n === 1 ? 'item' : 'items'}
              </AppText>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tileWrap: { flexBasis: '30%', flexGrow: 1 },
  tile: {
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.base,
    gap: Spacing.sm,
    minHeight: 108,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
});
