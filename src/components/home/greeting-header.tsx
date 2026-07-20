/** Calm, time-aware greeting for the top of the Home dashboard. */

import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';

function timeGreeting(hour: number): string {
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

export function GreetingHeader({ name = 'Aditya' }: { name?: string }) {
  const hour = new Date().getHours();
  return (
    <View style={styles.wrap}>
      <AppText variant="caption" color="textSecondary">
        {timeGreeting(hour)}
      </AppText>
      <AppText variant="greeting">Namaste, {name}</AppText>
      <AppText variant="body" color="textSecondary" style={styles.sub}>
        Your documents, safe on this device.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  sub: { marginTop: 2 },
});
