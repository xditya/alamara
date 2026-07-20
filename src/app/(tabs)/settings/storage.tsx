import { useMemo } from 'react';
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

// TODO(device): real byte usage comes from the encrypted store + file blobs.
// The MB figures below are illustrative placeholders.
const MOCK_TOTAL_MB = 248;
const MOCK_CACHE_MB = 34;
const DEVICE_TOTAL_MB = 2048;

const CATEGORIES: DocCategory[] = ['aadhaar', 'pan', 'id', 'ticket', 'certificate', 'other'];

export default function StorageSettings() {
  const theme = useTheme();
  const toast = useToast();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { documents } = useDocuments();

  const counts = useMemo(() => {
    const map = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<DocCategory, number>;
    for (const d of documents) map[d.category] = (map[d.category] ?? 0) + 1;
    return map;
  }, [documents]);

  const active = CATEGORIES.filter((c) => counts[c] > 0);
  const usedPct = Math.min(100, Math.round((MOCK_TOTAL_MB / DEVICE_TOTAL_MB) * 100));

  return (
    <SettingsScreen title="Storage" back>
      <SettingGroup
        title="On this device"
        footer={`Alamara is using about ${MOCK_TOTAL_MB} MB of ${DEVICE_TOTAL_MB / 1024} GB — roughly ${usedPct}% of allocated space.`}
        index={0}
      >
        <View style={styles.summary}>
          <View style={styles.summaryHead}>
            <AppText variant="title">{MOCK_TOTAL_MB} MB</AppText>
            <AppText variant="caption" color="textSecondary">
              {documents.length} documents
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
        footer="Cached previews and decrypted temp files. Clearing is safe — they rebuild on demand."
        index={2}
      >
        <SettingRow label="Cached data" value={`${MOCK_CACHE_MB} MB`} showChevron={false} />
      </SettingGroup>

      <Button
        title="Clear cache"
        icon="trash"
        variant="secondary"
        onPress={() => toast.show('Cache cleared')}
      />
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
