import { useMemo } from 'react';

import { SettingGroup } from '@/components/settings/setting-group';
import { SettingRow } from '@/components/settings/setting-row';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { Button } from '@/components/ui/button';
import { CategoryColors, type DocCategory } from '@/constants/theme';
import { CATEGORY_LABELS } from '@/types/models';
import { useToast } from '@/components/ui/toast';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDocuments } from '@/hooks/use-documents';

// TODO(device): custom categories & tag management persist to the encrypted store.

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
  const toast = useToast();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { documents } = useDocuments();

  const counts = useMemo(() => {
    const map = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<DocCategory, number>;
    for (const d of documents) map[d.category] = (map[d.category] ?? 0) + 1;
    return map;
  }, [documents]);

  return (
    <SettingsScreen title="Categories & Tags" back>
      <SettingGroup
        title="Categories"
        footer="Alamara auto-sorts every document into one of these. Counts update as you add more."
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

      <Button
        title="Add custom category"
        icon="plus"
        variant="secondary"
        onPress={() => toast.show('Custom categories are coming soon')}
      />
    </SettingsScreen>
  );
}
