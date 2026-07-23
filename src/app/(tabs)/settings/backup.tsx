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

function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB';
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function BackupSettings() {
  const theme = useTheme();
  const toast = useToast();
  const [busy, setBusy] = useState<null | 'export' | 'import'>(null);
  // Packing images is slow enough to need a running commentary, and the finished
  // size is the thing users most want to know before they pick a place to save it.
  const [progress, setProgress] = useState<string | null>(null);

  const onExport = async () => {
    if (busy) return;
    setBusy('export');
    setProgress('Preparing backup…');
    try {
      const res = await db.exportVault((done, total) => {
        setProgress(total ? `Packing page ${done} of ${total}…` : 'Preparing backup…');
      });
      setProgress(null);
      const size = formatBytes(res.bytes);
      const missing = res.skippedPages ? ` · ${plural(res.skippedPages, 'image')} missing` : '';
      if (await Sharing.isAvailableAsync()) {
        toast.show(`Backup ready · ${size}${missing}`);
        await Sharing.shareAsync(res.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Save your Alamara backup',
        });
      } else {
        toast.show('Sharing is not available on this device');
      }
    } catch {
      toast.show('Could not create the backup');
    } finally {
      setProgress(null);
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
      setProgress('Restoring…');
      const added = await db.importVault(res.assets[0].uri);
      if (added.documents === 0 && added.tickets === 0) {
        toast.show('Nothing new to restore');
      } else {
        const detail = added.legacy
          ? 'older backup, no images'
          : plural(added.pages, 'page image') + ' restored';
        toast.show(`Restored ${plural(added.documents, 'document')} · ${detail}`);
      }
    } catch {
      toast.show('That file could not be restored');
    } finally {
      setProgress(null);
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
            Your backup is a single file that never touches a server. It carries your page images
            too, so keep it somewhere you trust — an external drive, a password manager, or your own
            storage.
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

      {progress ? (
        <AppText variant="caption" color="textSecondary" style={styles.note}>
          {progress}
        </AppText>
      ) : null}

      <AppText variant="caption" color="textSecondary" style={styles.note}>
        The backup holds every document&apos;s details, fields, tags and tickets — and the page
        images themselves, so restoring on a new phone brings your documents back complete. Packing
        the images makes the file large (roughly a third bigger than the images on their own).
        Restoring merges the file in and never overwrites what you already have.
      </AppText>

      <AppText variant="caption" color="textSecondary" style={styles.note}>
        Backups made by older versions of Alamara hold details only. Those still restore, but their
        pages come back as placeholders you can re-scan.
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
