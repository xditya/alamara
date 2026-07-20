import { StyleSheet, View } from 'react-native';

import { SettingsScreen } from '@/components/settings/settings-screen';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/hooks/use-theme';

// TODO(device): file export — write an AES-GCM encrypted archive via the crypto
// service and hand it to the OS share sheet / document picker. Restore reverses it.

export default function BackupSettings() {
  const theme = useTheme();
  const toast = useToast();

  return (
    <SettingsScreen title="Backup & Restore" back>
      <View style={[styles.banner, { backgroundColor: theme.primaryMuted, borderRadius: Radius.card }]}>
        <View style={[styles.bannerIcon, { backgroundColor: theme.surface }]}>
          <Icon name="shield" size={20} color={theme.primary} />
        </View>
        <View style={styles.bannerText}>
          <AppText variant="section" color="primary">
            No cloud. You hold the file.
          </AppText>
          <AppText variant="caption" color="textSecondary">
            Your backup is a single encrypted file that never touches a server. Save it wherever you
            trust — an external drive, a password manager, or your own storage.
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Export encrypted backup"
          icon="upload"
          onPress={() => toast.show('Preparing encrypted backup…')}
        />
        <Button
          title="Restore from file"
          icon="download"
          variant="secondary"
          onPress={() => toast.show('Choose a backup file to restore')}
        />
      </View>

      <AppText variant="caption" color="textSecondary" style={styles.note}>
        Restoring merges the backup with what is already on this device. You will be asked to
        confirm before anything is overwritten.
      </AppText>
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: { flex: 1, gap: 3 },
  actions: { gap: Spacing.md },
  note: { marginHorizontal: Spacing.base },
});
