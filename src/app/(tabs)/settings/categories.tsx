import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { SettingGroup } from '@/components/settings/setting-group';
import { SettingRow } from '@/components/settings/setting-row';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { CategoryColors, type DocCategory, Radius, Spacing } from '@/constants/theme';
import { CATEGORY_LABELS } from '@/types/models';
import { useToast } from '@/components/ui/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDocuments } from '@/hooks/use-documents';
import { useTheme } from '@/hooks/use-theme';
import * as db from '@/services/db';

const CATEGORIES: DocCategory[] = ['aadhaar', 'pan', 'id', 'ticket', 'certificate', 'other'];

const ICONS: Record<DocCategory, 'shield' | 'file' | 'wallet' | 'star'> = {
  aadhaar: 'shield',
  pan: 'file',
  id: 'file',
  ticket: 'wallet',
  certificate: 'star',
  other: 'file',
};

export default function CategoriesSettings() {
  const theme = useTheme();
  const toast = useToast();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { documents, refresh } = useDocuments();

  const counts = useMemo(() => {
    const map = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<DocCategory, number>;
    for (const d of documents) map[d.category] = (map[d.category] ?? 0) + 1;
    return map;
  }, [documents]);

  const tags = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of documents) for (const t of d.tags) map.set(t, (map.get(t) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [documents]);

  const removeTag = useCallback(
    async (tag: string) => {
      await db.removeTagEverywhere(tag);
      toast.show(`Removed “${tag}”`);
      refresh();
    },
    [refresh, toast],
  );

  return (
    <SettingsScreen title="Categories & Tags" back>
      <SettingGroup
        title="Categories"
        footer="Alamara sorts every document into one of these. Counts update as you add more."
        index={0}
      >
        {CATEGORIES.map((c) => {
          const col = CategoryColors[scheme][c];
          return (
            <SettingRow
              key={c}
              icon={ICONS[c]}
              iconTint={col.tint}
              iconColor={col.fg}
              label={CATEGORY_LABELS[c]}
              value={`${counts[c]} ${counts[c] === 1 ? 'doc' : 'docs'}`}
              showChevron={false}
            />
          );
        })}
      </SettingGroup>

      <SettingGroup
        title="Your tags"
        footer={
          tags.length > 0
            ? 'Tap the ✕ to remove a tag from every document that uses it.'
            : 'Add tags while reviewing a document — they will appear here to manage.'
        }
        index={1}
      >
        {tags.length === 0 ? (
          <View style={styles.emptyRow}>
            <AppText variant="body" color="textSecondary">
              No tags yet
            </AppText>
          </View>
        ) : (
          <View style={styles.tagWrap}>
            {tags.map(([tag, count]) => (
              <PressableScale
                key={tag}
                onPress={() => removeTag(tag)}
                accessibilityRole="button"
                accessibilityLabel={`Remove tag ${tag}`}
                style={[styles.tag, { backgroundColor: theme.backgroundElement }]}
              >
                <AppText variant="label">{tag}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {count}
                </AppText>
                <Icon name="close" size={13} color="textSecondary" />
              </PressableScale>
            ))}
          </View>
        )}
      </SettingGroup>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  emptyRow: { padding: Spacing.base },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.base },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    minHeight: 40,
  },
});
