import { StyleSheet, View } from 'react-native';

import { SettingGroup } from '@/components/settings/setting-group';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { AppText } from '@/components/ui/text';
import { CategoryColors, Radius, Spacing } from '@/constants/theme';
import { CATEGORY_LABELS, type DocCategory } from '@/types/models';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { setThemeChoice, usePreferences } from '@/lib/theme-store';
import type { ThemeChoice } from '@/services/preferences';

const CATEGORIES: DocCategory[] = ['aadhaar', 'pan', 'id', 'ticket', 'certificate', 'other'];

export default function AppearanceSettings() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { theme } = usePreferences();

  const footer =
    theme === 'system'
      ? 'Following your system appearance. Switch to Light or Dark to override it.'
      : `Using the ${theme} theme everywhere in Alamara.`;

  return (
    <SettingsScreen title="Appearance" back>
      <SettingGroup title="Theme" footer={footer} index={0}>
        <View style={styles.segWrap}>
          <SegmentedControl<ThemeChoice>
            value={theme}
            onChange={setThemeChoice}
            options={[
              { value: 'system', label: 'System', icon: 'settings' },
              { value: 'light', label: 'Light', icon: 'sun' },
              { value: 'dark', label: 'Dark', icon: 'moon' },
            ]}
          />
        </View>
      </SettingGroup>

      <SettingGroup
        title="Category accents"
        footer="Each category has its own soft tint across the app."
        index={1}
      >
        <View style={styles.swatchGrid}>
          {CATEGORIES.map((cat) => {
            const c = CategoryColors[scheme][cat];
            return (
              <View key={cat} style={styles.swatchItem}>
                <View style={[styles.swatch, { backgroundColor: c.tint, borderRadius: Radius.input }]}>
                  <View style={[styles.dot, { backgroundColor: c.fg }]} />
                </View>
                <AppText variant="caption" color="textSecondary">
                  {CATEGORY_LABELS[cat]}
                </AppText>
              </View>
            );
          })}
        </View>
      </SettingGroup>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  segWrap: { padding: Spacing.base },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base,
    padding: Spacing.base,
    justifyContent: 'space-between',
  },
  swatchItem: { alignItems: 'center', gap: Spacing.xs, width: 84 },
  swatch: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 20, height: 20, borderRadius: Radius.pill },
});
