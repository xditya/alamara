/**
 * TicketCard — a ticket-tinted, tap-to-open card for the wallet list.
 * Evokes a physical ticket: an info block up top, a dotted perforation with side
 * notches, then a "stub" row carrying a live countdown pill.
 */

import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Card } from '@/components/ui/card';
import { Countdown, formatEventDate } from '@/components/wallet/countdown';
import { CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { go } from '@/lib/nav';
import type { Ticket } from '@/types/models';

const DOT_COUNT = 22;

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = CategoryColors[scheme].ticket;

  return (
    <Card
      onPress={() => go(`/wallet/${ticket.id}`)}
      padded={false}
      style={[styles.card, { backgroundColor: c.tint, borderColor: 'transparent' }]}
    >
      {/* Info block */}
      <View style={styles.info}>
        <AppText variant="section" numberOfLines={2} style={{ color: c.fg }}>
          {ticket.eventTitle}
        </AppText>

        {ticket.venue ? (
          <View style={styles.metaRow}>
            <Icon name="tag" size={14} color={c.fg} />
            <AppText variant="caption" numberOfLines={1} style={[styles.meta, { color: c.fg }]}>
              {ticket.venue}
            </AppText>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Icon name="calendar" size={14} color={c.fg} />
          <AppText variant="caption" numberOfLines={1} style={[styles.meta, { color: c.fg }]}>
            {formatEventDate(ticket.eventAt)}
          </AppText>
        </View>
      </View>

      {/* Perforation: dotted tear line with punched-out side notches */}
      <View style={styles.perf}>
        <View style={[styles.notch, styles.notchLeft, { backgroundColor: theme.bgGrouped }]} />
        <View style={styles.dots}>
          {Array.from({ length: DOT_COUNT }).map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: c.fg }]} />
          ))}
        </View>
        <View style={[styles.notch, styles.notchRight, { backgroundColor: theme.bgGrouped }]} />
      </View>

      {/* Stub: countdown pill + open affordance */}
      <View style={styles.stub}>
        <View style={[styles.pill, { backgroundColor: theme.surface }]}>
          <Icon name="clock" size={13} color={c.fg} />
          <Countdown eventAt={ticket.eventAt} color={c.fg} />
        </View>
        <Icon name="chevronRight" size={20} color={c.fg} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'visible' },
  info: { padding: Spacing.base, paddingBottom: Spacing.md, gap: Spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  meta: { flexShrink: 1 },

  perf: { height: 16, flexDirection: 'row', alignItems: 'center' },
  dots: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  dot: { width: 4, height: 4, borderRadius: 2, opacity: 0.35 },
  notch: { position: 'absolute', width: 16, height: 16, borderRadius: 8, top: 0 },
  notchLeft: { left: -8 },
  notchRight: { right: -8 },

  stub: {
    padding: Spacing.base,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
    minHeight: 32,
  },
});
