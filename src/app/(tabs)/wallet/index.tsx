/**
 * Wallet — the ticket list. Upcoming tickets (with live countdowns) sit up top;
 * past/archived tickets are collected below, dimmed. Empty when there's nothing to show.
 */

import type { ReactNode } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { AppText } from '@/components/ui/text';
import { TicketCard } from '@/components/wallet/ticket-card';
import { Durations, Easings, StaggerMs } from '@/constants/motion';
import { Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { useTickets } from '@/hooks/use-tickets';
import type { Ticket } from '@/types/models';

export default function WalletScreen() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { upcoming, past, loading, refresh } = useTickets();

  const isEmpty = !loading && upcoming.length === 0 && past.length === 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.bgGrouped }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading && !isEmpty} onRefresh={refresh} tintColor={theme.primary} />
        }
      >
        <View style={styles.header}>
          <AppText variant="title">Wallet</AppText>
          <AppText variant="body" color="textSecondary">
            Tickets and passes, ready to scan.
          </AppText>
        </View>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : isEmpty ? (
          <View style={styles.empty}>
            <EmptyState
              icon="wallet"
              title="No tickets yet"
              message="Saved tickets and passes will appear here with a live countdown to each event."
            />
          </View>
        ) : (
          <>
            {upcoming.length > 0 ? (
              <Section title="Upcoming" count={upcoming.length}>
                {upcoming.map((ticket, i) => (
                  <TicketRow key={ticket.id} ticket={ticket} index={i} reduced={reduced} />
                ))}
              </Section>
            ) : null}

            {past.length > 0 ? (
              <Section title="Past" count={past.length} dimmed>
                {past.map((ticket, i) => (
                  <TicketRow key={ticket.id} ticket={ticket} index={upcoming.length + i} reduced={reduced} />
                ))}
              </Section>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  count,
  dimmed,
  children,
}: {
  title: string;
  count: number;
  dimmed?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={[styles.section, dimmed && styles.sectionDimmed]}>
      <View style={styles.sectionHeader}>
        <AppText variant="section">{title}</AppText>
        <Badge label={String(count)} />
      </View>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

function TicketRow({ ticket, index, reduced }: { ticket: Ticket; index: number; reduced: boolean }) {
  const entering = reduced
    ? FadeIn.duration(Durations.enter)
    : FadeInDown.duration(Durations.enter).easing(Easings.out).delay(index * StaggerMs);

  return (
    <Animated.View entering={entering}>
      <TicketCard ticket={ticket} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 120 },
  header: { gap: Spacing.xs, marginBottom: Spacing.lg },
  loading: { paddingVertical: Spacing.huge, alignItems: 'center' },
  empty: { paddingTop: Spacing.xxxl },
  section: { marginBottom: Spacing.xl },
  sectionDimmed: { opacity: 0.6 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  list: { gap: Spacing.base },
});
