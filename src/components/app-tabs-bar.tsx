/**
 * Alamara bottom tab bar — one universal implementation for native AND web, built
 * on the headless `expo-router/ui` primitives (not NativeTabs, which forced a
 * single placeholder drawable on Android). A rounded "Soft & Friendly" pill with
 * the four tabs and a raised center ＋ that opens the capture chooser.
 *
 * The four TabTriggers are the only children of the TabList (so route discovery is
 * unchanged); the ＋ is an absolute overlay centered over the pill's middle gap.
 */

import { TabList, type TabListProps, TabSlot, TabTrigger, type TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { TABS } from '@/constants/tabs';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { go } from '@/lib/nav';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot />
      {/* The TabTriggers MUST be the direct children of the asChild target so the
          navigator discovers them as screens — the ＋ is overlaid, not a trigger. */}
      <TabList asChild>
        <TabBar>
          {TABS.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.href as never} asChild>
              <TabButton icon={tab.icon} label={tab.title} />
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}

function TabBar({ children, ...rest }: TabListProps) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const insets = useSafeAreaInsets();

  return (
    <View {...rest} pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={[
          styles.pill,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          CardShadow[scheme],
        ]}
      >
        {children}
      </View>

      {/* Center capture action, floating over the pill's middle gap. */}
      <View style={styles.plusLayer} pointerEvents="box-none">
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Add a document"
          onPress={() => go('/capture')}
          style={[styles.plus, { backgroundColor: theme.primary }, CardShadow[scheme]]}
        >
          <Icon name="plus" size={26} color="onPrimary" />
        </PressableScale>
      </View>
    </View>
  );
}

function TabButton({ icon, label, isFocused, ...rest }: TabTriggerSlotProps & { icon: IconName; label: string }) {
  return (
    <Pressable {...rest} style={styles.tabBtn}>
      <Icon name={icon} size={22} color={isFocused ? 'primary' : 'textSecondary'} />
      <AppText variant="label" color={isFocused ? 'primary' : 'textSecondary'} style={styles.tabLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

const PILL_HEIGHT = 62;
const PLUS_SIZE = 56;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '92%',
    maxWidth: 460,
    height: PILL_HEIGHT,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  // Overlay spanning the pill; centers the ＋ over the empty middle gap.
  plusLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    width: PLUS_SIZE,
    height: PLUS_SIZE,
    borderRadius: PLUS_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Two tabs sit left of the ＋, two to the right; the wide center gap holds it.
  tabBtn: { alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 52, minHeight: 48 },
  tabLabel: { fontSize: 11 },
});
