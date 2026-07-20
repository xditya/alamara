import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { Icon, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label?: string; icon?: IconName }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <PressableScale key={o.value} onPress={() => onChange(o.value)} style={styles.seg}>
            <View
              style={[
                styles.inner,
                active && { backgroundColor: theme.surface },
                active && CardShadow[scheme],
              ]}
            >
              {o.icon ? <Icon name={o.icon} size={16} color={active ? 'text' : 'textSecondary'} /> : null}
              {o.label ? (
                <AppText variant="label" color={active ? 'text' : 'textSecondary'}>
                  {o.label}
                </AppText>
              ) : null}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: Radius.input, padding: 3, gap: 3 },
  seg: { flex: 1 },
  inner: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.input - 3,
    paddingVertical: Spacing.sm,
  },
});
