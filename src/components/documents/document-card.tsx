import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AppText } from '@/components/ui/text';
import { CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { go } from '@/lib/nav';
import { CATEGORY_LABELS, type DocCategory, type Document } from '@/types/models';

/** Per-category glyph used by the tinted icon chip across the Documents feature. */
export const CATEGORY_ICON: Record<DocCategory, IconName> = {
  aadhaar: 'shield',
  pan: 'file',
  id: 'star',
  ticket: 'calendar',
  certificate: 'star',
  other: 'folder',
};

/** "3d ago" / "2w ago" style relative timestamp. */
export function relativeDate(ts: number): string {
  const day = 86_400_000;
  const d = Math.floor((Date.now() - ts) / day);
  if (d <= 0) return 'Today';
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d / 7)}w ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export function DocumentCard({
  document,
  layout = 'grid',
}: {
  document: Document;
  layout?: 'grid' | 'list';
}) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = CategoryColors[scheme][document.category];
  const label = CATEGORY_LABELS[document.category];

  const preview = document.fields.find((f) => f.mono || f.copyable);
  const pages = document.pages.length;
  const meta = `${pages} ${pages === 1 ? 'page' : 'pages'} · ${relativeDate(document.updatedAt)}`;

  const iconChip = (
    <View style={[styles.iconChip, { backgroundColor: c.tint }]}>
      <Icon name={CATEGORY_ICON[document.category]} size={20} color={c.fg} />
    </View>
  );

  if (layout === 'list') {
    return (
      <Card onPress={() => go('/documents/' + document.id)}>
        <View style={styles.listRow}>
          {iconChip}
          <View style={styles.listBody}>
            <AppText variant="section" numberOfLines={1}>
              {document.name}
            </AppText>
            {preview ? (
              <AppText variant="mono" color="textSecondary" numberOfLines={1} style={styles.listMono}>
                {preview.value}
              </AppText>
            ) : null}
            <View style={styles.metaRow}>
              <Badge label={label} />
              <AppText variant="caption" color="textSecondary">
                {meta}
              </AppText>
            </View>
          </View>
          <Icon name="chevronRight" size={20} color="textSecondary" />
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={() => go('/documents/' + document.id)}>
      <View style={styles.gridTop}>
        {iconChip}
        <Badge label={label} />
      </View>
      <AppText variant="section" numberOfLines={2} style={styles.gridName}>
        {document.name}
      </AppText>
      {preview ? (
        <AppText variant="mono" color="textSecondary" numberOfLines={1} style={styles.gridMono}>
          {preview.value}
        </AppText>
      ) : null}
      <View style={styles.gridFooter}>
        <Icon name="file" size={13} color="textSecondary" />
        <AppText variant="caption" color="textSecondary">
          {meta}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: Radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // list
  listRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  listBody: { flex: 1, gap: 4 },
  listMono: { fontSize: 13, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  // grid
  gridTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  gridName: { marginTop: Spacing.md },
  gridMono: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  gridFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
});
