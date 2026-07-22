import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SettingGroup } from '@/components/settings/setting-group';
import { SettingRow } from '@/components/settings/setting-row';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { CategoryColors, type DocCategory, Radius, Spacing } from '@/constants/theme';
import { CATEGORY_LABELS } from '@/types/models';
import { useToast } from '@/components/ui/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDocuments } from '@/hooks/use-documents';
import { useTheme } from '@/hooks/use-theme';
import { useFocusEffect } from 'expo-router';
import { useMemo } from 'react';
import * as db from '@/services/db';

const CATEGORIES: DocCategory[] = ['aadhaar', 'pan', 'id', 'ticket', 'certificate', 'other'];

function formatBytes(bytes: number): string {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

export default function StorageSettings() {
  const theme = useTheme();
  const toast = useToast();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { documents } = useDocuments();

  const [usage, setUsage] = useState<db.StorageUsage | null>(null);
  const [cacheBytes, setCacheBytes] = useState(0);

  const refresh = useCallback(() => {
    db.getStorageUsage().then(setUsage);
    db.getCacheSize().then(setCacheBytes);
  }, []);

  useFocusEffect(refresh);

  const counts = useMemo(() => {
    const map = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<DocCategory, number>;
    for (const d of documents) map[d.category] = (map[d.category] ?? 0) + 1;
    return map;
  }, [documents]);

  const active = CATEGORIES.filter((c) => counts[c] > 0);
  const usedBytes = usage?.used ?? 0;
  const totalBytes = usage?.total ?? 0;
  const usedPct = totalBytes > 0 ? Math.min(100, Math.max(1, Math.round((usedBytes / totalBytes) * 100))) : 0;

  const onClearCache = async () => {
    await db.clearCache();
    setCacheBytes(0);
    toast.show('Cache cleared');
  };

  return (
    <SettingsScreen title="Storage" back>
      <SettingGroup
        title="On this device"
        footer={
          totalBytes > 0
            ? `Alamara is using ${formatBytes(usedBytes)} of ${formatBytes(totalBytes)} — about ${usedPct}% of device storage.`
            : 'Alamara stores everything locally on this device.'
        }
        index={0}
      >
        <View style={styles.summary}>
          <View style={styles.summaryHead}>
            <AppText variant="title">{formatBytes(usedBytes)}</AppText>
            <AppText variant="caption" color="textSecondary">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'} ·{' '}
              {usage?.blobCount ?? 0} {usage?.blobCount === 1 ? 'file' : 'files'}
            </AppText>
          </View>

          <View style={[styles.bar, { backgroundColor: theme.backgroundElement }]}>
            {active.length > 0 ? (
              active.map((c) => (
                <View
                  key={c}
                  style={{ flex: counts[c], backgroundColor: CategoryColors[scheme][c].fg }}
                />
              ))
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        </View>
      </SettingGroup>

      <SettingGroup title="By category" index={1}>
        {CATEGORIES.map((c) => {
          const col = CategoryColors[scheme][c];
          return (
            <SettingRow
              key={c}
              icon="file"
              iconTint={col.tint}
              iconColor={col.fg}
              label={CATEGORY_LABELS[c]}
              value={`${counts[c]} ${counts[c] === 1 ? 'item' : 'items'}`}
              showChevron={false}
            />
          );
        })}
      </SettingGroup>

      <SettingGroup
        title="Cache"
        footer="Decoded previews and temporary files. Clearing is safe — they rebuild on demand."
        index={2}
      >
        <SettingRow label="Cached data" value={formatBytes(cacheBytes)} showChevron={false} />
      </SettingGroup>

      <Button title="Clear cache" icon="trash" variant="secondary" onPress={onClearCache} />
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  summary: { padding: Spacing.base, gap: Spacing.md },
  summaryHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  bar: {
    height: 12,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    flexDirection: 'row',
    gap: 2,
  },
});
