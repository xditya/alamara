/**
 * Alamara bottom tab bar — one universal implementation for native AND web, built
 * on the headless `expo-router/ui` primitives (not NativeTabs, which forced a
 * single placeholder drawable on Android). A rounded "Soft & Friendly" pill with
 * four tabs split two-and-two around a raised center ＋ that opens the capture chooser.
 *
 * Layout: [Home Documents] · [＋] · [Wallet Settings]. The four TabTriggers are the
 * only children of <TabBar> (expo-router discovers them from that flat prop tree — see
 * parseTriggersFromChildren in expo-router/ui), but inside TabBar's render we regroup
 * the received array into a left half + a fixed-width center slot + a right half. That
 * reserved slot is what keeps the ＋ off the inner tabs' labels — a plain overlay on a
 * `space-between` row parks the ＋ right on top of the Documents/Wallet text.
 */

import { TabList, type TabListProps, TabSlot, TabTrigger, type TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Children } from 'react';
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
      {/* The TabTriggers MUST stay the direct children of the asChild target so the
          navigator discovers them as screens — TabBar regroups them at render time,
          and the ＋ is overlaid, not a trigger. */}
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

  // Split the four triggers into two halves that flex on either side of the ＋ slot.
  const triggers = Children.toArray(children);
  const half = Math.ceil(triggers.length / 2);
  const left = triggers.slice(0, half);
  const right = triggers.slice(half);

  return (
    <View {...rest} pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) }]}>
      <View
        style={[
          styles.pill,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          CardShadow[scheme],
        ]}
      >
        <View style={styles.side}>{left}</View>
        {/* Reserved gap the ＋ lives over, so it never overlaps a tab label. */}
        <View style={styles.centerSlot} pointerEvents="none" />
        <View style={styles.side}>{right}</View>
      </View>

      {/* Center capture action, floating over the reserved middle slot. */}
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
  const theme = useTheme();
  return (
    <Pressable {...rest} style={styles.tabBtn}>
      {/* A soft pill sits behind the active icon so the focused tab reads clearly.
          It's always present (transparent when idle) to keep the row height stable. */}
      <View style={[styles.iconChip, isFocused && { backgroundColor: theme.primaryMuted }]}>
        <Icon name={icon} size={22} color={isFocused ? 'primary' : 'textSecondary'} />
      </View>
      <AppText
        variant="label"
        color={isFocused ? 'primary' : 'textSecondary'}
        numberOfLines={1}
        style={styles.tabLabel}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const PILL_HEIGHT = 64;
const PLUS_SIZE = 54;
const CENTER_SLOT = 64;
// How far the ＋ pokes above the pill, giving it FAB-like prominence.
const PLUS_RAISE = 10;

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '92%',
    maxWidth: 460,
    height: PILL_HEIGHT,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
  },
  // Each half holds two tabs and flexes to fill the space beside the center slot.
  side: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  centerSlot: { width: CENTER_SLOT },
  // Overlay spanning the pill; centers the ＋ over the reserved middle slot and lifts it.
  plusLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -PLUS_RAISE,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plus: {
    width: PLUS_SIZE,
    height: PLUS_SIZE,
    borderRadius: Radius.button + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 44 },
  iconChip: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontSize: 11, lineHeight: 14 },
});
