import { StyleSheet, View } from 'react-native';

import { SettingGroup } from '@/components/settings/setting-group';
import { SettingRow } from '@/components/settings/setting-row';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/hooks/use-theme';

const VERSION = '1.0.0';

export default function AboutSettings() {
  const theme = useTheme();
  const toast = useToast();

  return (
    <SettingsScreen title="About" back>
      <View style={styles.hero}>
        <View style={[styles.appIcon, { backgroundColor: theme.primary, borderRadius: Radius.sheet }]}>
          <Icon name="lock" size={34} color={theme.onPrimary} />
        </View>
        <AppText variant="greeting">Alamara</AppText>
        <AppText variant="body" color="textSecondary" style={styles.tagline}>
          Your family almirah for important papers — private, on-device.
        </AppText>
        <AppText variant="caption" color="textSecondary">
          Version {VERSION}
        </AppText>
      </View>

      <SettingGroup
        title="Privacy"
        footer="Alamara is local-first. Your Aadhaar, PAN, IDs, tickets, and certificates are encrypted on this device. There is no account, no server, and no analytics."
        index={0}
      >
        <SettingRow
          icon="shield"
          label="Nothing leaves your phone"
          subtitle="No cloud, no tracking, no sign-in"
          showChevron={false}
        />
      </SettingGroup>

      <SettingGroup title="Legal" index={1}>
        <SettingRow label="Licenses" onPress={() => toast.show('Open-source licenses')} />
      </SettingGroup>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  appIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  tagline: { textAlign: 'center', maxWidth: 300 },
});
