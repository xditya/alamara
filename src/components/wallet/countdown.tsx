/**
 * Countdown — a live "time until event" label used on ticket cards and the glance card.
 * Recomputes on a lightweight interval (cleared on unmount) and never pulls in a date lib.
 *
 * Renders like: "in 3d 5h" · "in 2h 10m" · "in 40m" · "Starting soon" · "Ended".
 */

import { useEffect, useState } from 'react';
import type { StyleProp, TextStyle } from 'react-native';

import { AppText } from '@/components/ui/text';

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** Pure helper: format the gap between `eventAt` and `now` (both epoch ms). */
export function formatCountdown(eventAt: number, now: number): { label: string; ended: boolean } {
  const diff = eventAt - now;
  if (diff <= 0) return { label: 'Ended', ended: true };

  const days = Math.floor(diff / DAY);
  const hours = Math.floor((diff % DAY) / HOUR);
  const mins = Math.floor((diff % HOUR) / MINUTE);

  if (days >= 1) return { label: `in ${days}d ${hours}h`, ended: false };
  if (hours >= 1) return { label: `in ${hours}h ${mins}m`, ended: false };
  if (mins >= 1) return { label: `in ${mins}m`, ended: false };
  return { label: 'Starting soon', ended: false };
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Shared date/time formatter, e.g. "Sat, 23 Jul · 7:30 PM". No Intl dependency. */
export function formatEventDate(ms: number): string {
  const d = new Date(ms);
  const wd = WEEKDAYS[d.getDay()];
  const mon = MONTHS[d.getMonth()];
  let hours = d.getHours();
  const mins = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mm = mins < 10 ? `0${mins}` : `${mins}`;
  return `${wd}, ${d.getDate()} ${mon} · ${hours}:${mm} ${ampm}`;
}

export function Countdown({
  eventAt,
  color,
  style,
}: {
  eventAt: number;
  /** Optional explicit text color (e.g. a category `fg` tint). Falls back to the text token. */
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  const { label } = formatCountdown(eventAt, now);

  return (
    <AppText variant="label" style={[color ? { color } : null, style]}>
      {label}
    </AppText>
  );
}
