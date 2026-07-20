/** Compact, category-tinted document card for the Home horizontal rails. */

import { StyleSheet, View } from 'react-native';

import { CATEGORY_ICONS } from '@/components/home/category-icons';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { go } from '@/lib/nav';
import { CATEGORY_LABELS, type Document } from '@/types/models';

export function HomeDocCard({ doc }: { doc: Document }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = CategoryColors[scheme][doc.category];

  return (
    <Card onPress={() => go('/documents/' + doc.id)} style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: c.tint }]}>
        <Icon name={CATEGORY_ICONS[doc.category]} size={20} color={c.fg} />
      </View>
      <View style={styles.meta}>
        <AppText variant="body" numberOfLines={2} style={styles.name}>
          {doc.name}
        </AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {CATEGORY_LABELS[doc.category]}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: 168, gap: Spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { gap: 2 },
  name: { fontSize: 15, lineHeight: 20 },
});
