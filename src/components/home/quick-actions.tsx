/** Three tappable shortcut cards: Scan · Import · Recent. */

import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { CategoryColors, Radius, Spacing, type DocCategory } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { go } from '@/lib/nav';

type Action = { key: string; label: string; icon: IconName; route: string; tint: DocCategory };

const ACTIONS: Action[] = [
  { key: 'scan', label: 'Scan', icon: 'scan', route: '/scan', tint: 'id' },
  { key: 'import', label: 'Import', icon: 'download', route: '/capture', tint: 'pan' },
  { key: 'recent', label: 'Recent', icon: 'clock', route: '/documents', tint: 'certificate' },
];

export function QuickActions() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <View style={styles.row}>
      {ACTIONS.map((a) => {
        const c = CategoryColors[scheme][a.tint];
        return (
          <View key={a.key} style={styles.item}>
            <Card onPress={() => go(a.route)} style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: c.tint }]}>
                <Icon name={a.icon} size={22} color={c.fg} />
              </View>
              <AppText variant="label">{a.label}</AppText>
            </Card>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.md },
  item: { flex: 1 },
  card: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
