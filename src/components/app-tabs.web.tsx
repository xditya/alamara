import { TabList, type TabListProps, TabSlot, TabTrigger, type TabTriggerSlotProps, Tabs } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { TABS } from '@/constants/tabs';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      {/* TabTriggers MUST be direct children of the asChild target so the navigator can
          discover them as screens — do not nest them inside extra Views. */}
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

function TabBar(props: TabListProps) {
  const theme = useTheme();
  return (
    <View {...props} style={styles.wrap}>
      <View style={[styles.bar, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        {props.children}
      </View>
    </View>
  );
}

function TabButton({ icon, label, isFocused, ...rest }: TabTriggerSlotProps & { icon: IconName; label: string }) {
  return (
    <Pressable {...rest} style={styles.tabBtn}>
      <Icon name={icon} size={20} color={isFocused ? 'primary' : 'textSecondary'} />
      <AppText variant="label" color={isFocused ? 'primary' : 'textSecondary'} style={{ fontSize: 11 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', bottom: Spacing.base, left: 0, right: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  tabBtn: { alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: Spacing.sm, minWidth: 56, minHeight: 44 },
});
