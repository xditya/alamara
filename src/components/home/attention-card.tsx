/** Highlights a document that needs attention — nearing expiry or still pending. */

import { StyleSheet, View } from 'react-native';

import { CATEGORY_ICONS } from '@/components/home/category-icons';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { go } from '@/lib/nav';
import { CATEGORY_LABELS, type Document } from '@/types/models';

type Note = { label: string; tone: 'warning' | 'danger' };

/** `days` is the whole-day countdown to expiry; omit it for a pending document. */
function noteFor(days: number | undefined): Note {
  if (days === undefined) return { label: 'Pending', tone: 'warning' };
  if (days < 0) return { label: `Expired ${Math.abs(days)}d ago`, tone: 'danger' };
  if (days === 0) return { label: 'Expires today', tone: 'danger' };
  if (days <= 7) return { label: `Expires in ${days}d`, tone: 'danger' };
  return { label: `Expires in ${days}d`, tone: 'warning' };
}

export function AttentionCard({ doc, days }: { doc: Document; days?: number }) {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = CategoryColors[scheme][doc.category];
  const note = noteFor(days);

  return (
    <Card onPress={() => go('/documents/' + doc.id)} style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: c.tint }]}>
          <Icon name={CATEGORY_ICONS[doc.category]} size={18} color={c.fg} />
        </View>
        <AppText variant="caption" color="textSecondary">
          {CATEGORY_LABELS[doc.category]}
        </AppText>
      </View>
      <AppText variant="body" numberOfLines={2} style={styles.name}>
        {doc.name}
      </AppText>
      <View style={styles.badgeRow}>
        <Icon name="clock" size={13} color={note.tone} />
        <Badge label={note.label} tone={note.tone} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: 232, gap: Spacing.sm, justifyContent: 'space-between' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 15, lineHeight: 20 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
});
