/** A single search result: category tint, name, and the field that matched the query. */

import { StyleSheet, View } from 'react-native';

import { CATEGORY_ICONS } from '@/components/home/category-icons';
import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { go } from '@/lib/nav';
import { CATEGORY_LABELS, type Document } from '@/types/models';

/** Describe why this document matched — prefer a concrete field/tag over the name. */
function matchedDetail(doc: Document, query: string): string {
  const q = query.trim().toLowerCase();
  if (q) {
    const field = doc.fields.find(
      (f) => f.value.toLowerCase().includes(q) || f.label.toLowerCase().includes(q),
    );
    if (field) return `${field.label} · ${field.value}`;
    const tag = doc.tags.find((t) => t.toLowerCase().includes(q));
    if (tag) return `Tag · ${tag}`;
  }
  return CATEGORY_LABELS[doc.category];
}

export function SearchResultRow({ doc, query }: { doc: Document; query: string }) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = CategoryColors[scheme][doc.category];

  return (
    <PressableScale
      onPress={() => go('/documents/' + doc.id)}
      style={[styles.row, { backgroundColor: theme.surface, borderColor: theme.border }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: c.tint }]}>
        <Icon name={CATEGORY_ICONS[doc.category]} size={20} color={c.fg} />
      </View>
      <View style={styles.meta}>
        <AppText variant="body" numberOfLines={1} style={styles.name}>
          {doc.name}
        </AppText>
        <AppText variant="caption" color="textSecondary" numberOfLines={1}>
          {matchedDetail(doc, query)}
        </AppText>
      </View>
      <Icon name="chevronRight" size={18} color="textSecondary" />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 64,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, gap: 2 },
  name: { fontSize: 15, lineHeight: 20 },
});
