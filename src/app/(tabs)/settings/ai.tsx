import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { SettingGroup } from '@/components/settings/setting-group';
import { SettingRow } from '@/components/settings/setting-row';
import { SettingsScreen } from '@/components/settings/settings-screen';
import { SwitchRow } from '@/components/settings/switch-row';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/hooks/use-theme';
import { setAiEnabled, usePreferences } from '@/lib/theme-store';
import { clearEmbeddingCache, isEmbedderReady, loadEmbedder, warmUpEmbedder } from '@/services/ai';

export default function AiSettings() {
  const theme = useTheme();
  const toast = useToast();
  const { aiEnabled } = usePreferences();

  const [ready, setReady] = useState(isEmbedderReady());
  const [progress, setProgress] = useState<number | null>(null);
  // The model outlives the JS context, the loaded module does not. On mount,
  // reload an already-downloaded model instead of offering to download it again.
  const [preparing, setPreparing] = useState(!isEmbedderReady());

  const downloading = progress !== null;

  useEffect(() => {
    let cancelled = false;
    void warmUpEmbedder()
      .catch(() => false)
      .then((loaded) => {
        if (cancelled) return;
        if (loaded) setReady(true);
        setPreparing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const download = async () => {
    if (downloading || ready || preparing) return;
    setProgress(0);
    try {
      await loadEmbedder((p) => setProgress(p));
      setReady(true);
      setProgress(null);
      setAiEnabled(true);
      toast.show('Semantic search is ready');
    } catch (err) {
      setProgress(null);
      const message = err instanceof Error ? err.message : String(err);
      // Surface the real reason (network, storage, missing native binding, …).
      console.error('[Alamara] embedding model load failed:', err);
      toast.show(message ? `Model failed: ${message}`.slice(0, 90) : 'Could not download the model');
    }
  };

  const onToggleSemantic = (value: boolean) => {
    if (value && !ready) {
      // Need the model first — kick off the download.
      void download();
      return;
    }
    setAiEnabled(value);
  };

  const modelStatus = ready
    ? 'Ready'
    : downloading
      ? `Downloading ${Math.round((progress ?? 0) * 100)}%`
      : preparing
        ? 'Checking…'
        : '~90 MB · not downloaded';

  return (
    <SettingsScreen title="AI & Indexing" back>
      <View style={[styles.banner, { backgroundColor: theme.primaryMuted, borderRadius: Radius.card }]}>
        <View style={[styles.bannerIcon, { backgroundColor: theme.surface }]}>
          <Icon name="shield" size={20} color={theme.primary} />
        </View>
        <View style={styles.bannerText}>
          <AppText variant="section" color="primary">
            All processing happens on-device
          </AppText>
          <AppText variant="caption" color="textSecondary">
            The model runs locally. Your documents are never uploaded for indexing or search.
          </AppText>
        </View>
      </View>

      <SettingGroup
        title="Search"
        footer="Semantic search finds documents by meaning, not just keywords. It needs the embedding model below."
        index={0}
      >
        <SwitchRow
          icon="search"
          label="Semantic search"
          subtitle={ready ? 'Understand queries, not only exact text' : 'Downloads a ~90 MB model on first use'}
          // Stay on while the already-downloaded model is being reloaded, so the
          // switch doesn't appear to turn itself off on every app launch.
          value={aiEnabled && (ready || preparing)}
          onValueChange={onToggleSemantic}
        />
      </SettingGroup>

      <SettingGroup
        title="On-device model"
        footer="Downloads once, over Wi-Fi. The embedding model powers semantic search."
        index={1}
      >
        <SettingRow icon="cpu" label="Embedding model (MiniLM)" subtitle={modelStatus} showChevron={false} />
      </SettingGroup>

      <Button
        title={
          ready
            ? 'Re-index all documents'
            : downloading
              ? 'Downloading…'
              : preparing
                ? 'Checking…'
                : 'Download & enable'
        }
        icon={ready ? 'refresh' : 'download'}
        variant={ready ? 'secondary' : 'primary'}
        loading={downloading || preparing}
        onPress={
          ready
            ? () => {
                clearEmbeddingCache();
                toast.show('Documents will re-index on the next search');
              }
            : download
        }
      />
    </SettingsScreen>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
