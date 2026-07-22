import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SettingsScreen } from '@/components/settings/settings-screen';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/hooks/use-theme';
import * as db from '@/services/db';

export default function BackupSettings() {
  const theme = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState<null | 'export' | 'import'>(null);

  const onExport = async () => {
    if (busy) return;
    setBusy('export');
    try {
      const uri = await db.exportVault();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/json',
          dialogTitle: 'Save your Alamara backup',
        });
      } else {
        toast.show('Sharing is not available on this device');
      }
    } catch {
      toast.show('Could not create the backup');
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    if (busy) return;
    setBusy('import');
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]) return;
      const added = await db.importVault(res.assets[0].uri);
      if (added.documents === 0 && added.tickets === 0) {
        toast.show('Nothing new to restore');
      } else {
        toast.show(`Restored ${added.documents} document${added.documents === 1 ? '' : 's'}`);
      }
    } catch {
      toast.show('That file could not be restored');
    } finally {
      setBusy(null);
    }
  };

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
            Your backup is a single file that never touches a server. Save it wherever you trust — an
            external drive, a password manager, or your own storage.
          </AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Export backup" icon="upload" onPress={onExport} loading={busy === 'export'} />
        <Button
          title="Restore from file"
          icon="download"
          variant="secondary"
          onPress={onRestore}
          loading={busy === 'import'}
        />
      </View>

      <AppText variant="caption" color="textSecondary" style={styles.note}>
        The backup holds every document&apos;s details, fields, tags and tickets. Page images stay on
        this device. Restoring merges the file in and never overwrites what you already have.
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
