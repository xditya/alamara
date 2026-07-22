/**
 * Ticket glance card — the "hold this up at the gate" screen. A large ticket-tinted
 * hero holds a prominent barcode, the event details and a live countdown, plus
 * add-to-calendar / archive actions.
 */

import * as Brightness from 'expo-brightness';
import * as Calendar from 'expo-calendar';
import { useEffect } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { BarcodeView } from '@/components/wallet/barcode-view';
import { Countdown, formatEventDate } from '@/components/wallet/countdown';
import { Durations, Easings } from '@/constants/motion';
import { CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { useTicket } from '@/hooks/use-tickets';
import { back } from '@/lib/nav';
import * as db from '@/services/db';
import { useLocalSearchParams } from 'expo-router';

export default function TicketGlanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const reduced = useReducedMotion();
  const toast = useToast();
  const { ticket, document, loading } = useTicket(id);

  // Ramp screen brightness to max while the ticket is on screen (so gate scanners
  // can read the code), then restore the previous level on unmount.
  useEffect(() => {
    let previous: number | null = null;
    let cancelled = false;
    (async () => {
      try {
        previous = await Brightness.getBrightnessAsync();
        if (!cancelled) await Brightness.setBrightnessAsync(1);
      } catch {
        // brightness control unavailable — ignore
      }
    })();
    return () => {
      cancelled = true;
      if (previous != null) Brightness.setBrightnessAsync(previous).catch(() => {});
    };
  }, []);

  const onAddToCalendar = async () => {
    if (!ticket) return;
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Calendar permission is needed');
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const target =
        calendars.find((c) => c.allowsModifications && c.source?.name !== 'Other') ??
        calendars.find((c) => c.allowsModifications) ??
        calendars[0];
      if (!target) {
        toast.show('No calendar available');
        return;
      }
      await Calendar.createEventAsync(target.id, {
        title: ticket.eventTitle,
        startDate: new Date(ticket.eventAt),
        endDate: new Date(ticket.eventAt + 2 * 60 * 60 * 1000),
        location: ticket.venue,
        notes: ticket.seat ? `Seat: ${ticket.seat}` : undefined,
        timeZone: undefined,
      });
      toast.show('Added to your calendar');
    } catch {
      toast.show('Could not add to calendar');
    }
  };

  const c = CategoryColors[scheme].ticket;
  const enter = reduced ? FadeIn.duration(Durations.enter) : FadeInDown.duration(Durations.page).easing(Easings.out);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.bgGrouped }]}>
      <View style={styles.headerBar}>
        <PressableScale
          onPress={back}
          hitSlop={10}
          style={[styles.backBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Icon name="chevronLeft" size={22} color="text" />
        </PressableScale>
        <AppText variant="label" color="textSecondary">
          TICKET
        </AppText>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={theme.primary} />
        </View>
      ) : !ticket ? (
        <View style={styles.center}>
          <EmptyState
            icon="wallet"
            title="Ticket not found"
            message="This ticket may have been removed."
            actionLabel="Go back"
            onAction={back}
          />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View
            entering={enter}
            style={[styles.hero, { backgroundColor: c.tint, borderColor: theme.border }]}
          >
            <BarcodeView value={ticket.barcodeValue} format={ticket.barcodeFormat} />

            <View style={styles.brightnessHint}>
              <Icon name="sun" size={13} color={c.fg} />
              <AppText variant="caption" style={{ color: c.fg }}>
                Screen brightened for scanning
              </AppText>
            </View>

            <AppText variant="title" style={[styles.title, { color: c.fg }]}>
              {ticket.eventTitle}
            </AppText>

            <View style={[styles.countdownPill, { backgroundColor: theme.surface }]}>
              <Icon name="clock" size={14} color={c.fg} />
              <Countdown eventAt={ticket.eventAt} color={c.fg} />
            </View>

            <View style={[styles.details, { borderTopColor: theme.border }]}>
              <DetailRow icon="calendar" fg={c.fg} label="When" value={formatEventDate(ticket.eventAt)} />
              {ticket.venue ? (
                <DetailRow icon="tag" fg={c.fg} label="Where" value={ticket.venue} />
              ) : null}
              {ticket.seat ? (
                <DetailRow icon="grid" fg={c.fg} label="Seat" value={ticket.seat} mono />
              ) : null}
            </View>
          </Animated.View>

          {document ? (
            <AppText variant="caption" color="textSecondary" style={styles.source}>
              From “{document.name}”
            </AppText>
          ) : null}

          <View style={styles.actions}>
            <Button title="Add to calendar" icon="calendar" onPress={onAddToCalendar} />
            <Button
              title={ticket.status === 'archived' ? 'Archived' : 'Archive ticket'}
              variant="secondary"
              icon="folder"
              onPress={async () => {
                if (ticket.status === 'archived') return;
                await db.saveTicket({ ...ticket, status: 'archived' });
                toast.show('Ticket archived');
                back();
              }}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  fg,
  label,
  value,
  mono,
}: {
  icon: IconName;
  fg: string;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Icon name={icon} size={16} color={fg} />
      <AppText variant="caption" style={[styles.detailLabel, { color: fg }]}>
        {label}
      </AppText>
      <AppText variant={mono ? 'mono' : 'body'} numberOfLines={2} style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: 120 },

  hero: {
    borderRadius: Radius.sheet,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.base,
  },
  brightnessHint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, opacity: 0.9 },
  title: { textAlign: 'center' },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    minHeight: 40,
  },
  details: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    paddingTop: Spacing.base,
    gap: Spacing.md,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailLabel: { width: 48, opacity: 0.9 },
  detailValue: { flex: 1 },

  source: { textAlign: 'center', marginTop: Spacing.base },
  actions: { marginTop: Spacing.xl, gap: Spacing.md },
});
