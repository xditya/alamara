import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { back as goBack } from '@/lib/nav';
import { useTheme } from '@/hooks/use-theme';

/**
 * Shared scaffold for every Settings screen: grouped background, a title (with
 * an optional back affordance for subpages), and a scrolling content column.
 */
export function SettingsScreen({
  title,
  subtitle,
  back,
  bottomPad = 40,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Show a back chevron (subpages). The index tab omits it. */
  back?: boolean;
  /** Bottom padding — the index tab uses ~120 to clear the tab bar. */
  bottomPad?: number;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.bgGrouped }]}>
      <View style={styles.header}>
        {back ? (
          <PressableScale onPress={goBack} hitSlop={12} style={styles.backBtn}>
            <Icon name="chevronLeft" size={24} color={theme.primary} />
          </PressableScale>
        ) : null}
        <View style={styles.titleWrap}>
          <AppText variant="title">{title}</AppText>
          {subtitle ? (
            <AppText variant="caption" color="textSecondary">
              {subtitle}
            </AppText>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backBtn: { marginLeft: -Spacing.xs },
  titleWrap: { flex: 1, gap: 2 },
  content: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.xl,
  },
});
