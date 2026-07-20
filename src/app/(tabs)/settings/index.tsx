import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { SettingGroup } from '@/components/settings/setting-group';
import { SettingRow } from '@/components/settings/setting-row';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Durations, Easings } from '@/constants/motion';
import { CategoryColors, type DocCategory, Radius, Spacing } from '@/constants/theme';
import { go } from '@/lib/nav';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';

type Item = { icon: IconName; label: string; subtitle?: string; tint: DocCategory; route: string };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: 'Privacy & Security',
    items: [
      { icon: 'shield', label: 'Security', subtitle: 'App lock, auto-lock, privacy', tint: 'id', route: '/settings/security' },
    ],
  },
  {
    title: 'Preferences',
    items: [
      { icon: 'sun', label: 'Appearance', subtitle: 'Theme & accents', tint: 'ticket', route: '/settings/appearance' },
      { icon: 'cpu', label: 'AI & Indexing', subtitle: 'On-device search & models', tint: 'pan', route: '/settings/ai' },
      { icon: 'tag', label: 'Categories & Tags', tint: 'aadhaar', route: '/settings/categories' },
    ],
  },
  {
    title: 'Data',
    items: [
      { icon: 'database', label: 'Storage', subtitle: 'Usage & cache', tint: 'certificate', route: '/settings/storage' },
      { icon: 'upload', label: 'Backup & Restore', subtitle: 'Export an encrypted file', tint: 'other', route: '/settings/backup' },
    ],
  },
  {
    title: 'About',
    items: [{ icon: 'info', label: 'About Alamara', tint: 'other', route: '/settings/about' }],
  },
];

export default function SettingsIndex() {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const reduced = useReducedMotion();

  const bannerEntering = reduced
    ? FadeIn.duration(Durations.enter)
    : FadeInDown.duration(Durations.enter).easing(Easings.out);

  return (
    <SettingsScreen title="Settings" bottomPad={120}>
      <Animated.View
        entering={bannerEntering}
        style={[styles.banner, { backgroundColor: theme.primaryMuted, borderRadius: Radius.card }]}
      >
        <View style={[styles.bannerIcon, { backgroundColor: theme.surface }]}>
          <Icon name="lock" size={20} color={theme.primary} />
        </View>
        <View style={styles.bannerText}>
          <AppText variant="section" color="primary">
            Private by design
          </AppText>
          <AppText variant="caption" color="textSecondary">
            Everything is stored and indexed on this device. Nothing leaves your phone.
          </AppText>
        </View>
      </Animated.View>

      {GROUPS.map((group, gi) => (
        <SettingGroup key={group.title} title={group.title} index={gi + 1}>
          {group.items.map((item) => {
            const c = CategoryColors[scheme][item.tint];
            return (
              <SettingRow
                key={item.route}
                icon={item.icon}
                iconTint={c.tint}
                iconColor={c.fg}
                label={item.label}
                subtitle={item.subtitle}
                onPress={() => go(item.route)}
              />
            );
          })}
        </SettingGroup>
      ))}
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1, gap: 3 },
});
