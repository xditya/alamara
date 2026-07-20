import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
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

// TODO(device): wire semantic search + model downloads to react-native-executorch.
// Toggles and download state are in-memory placeholders.

const MODELS = [
  {
    id: 'embed',
    label: 'Embedding model',
    subtitle: '~90 MB · Powers semantic search on most devices',
  },
  {
    id: 'gemma',
    label: 'Gemma 3 1B',
    subtitle: '~600 MB · On-device Q&A · Needs 4 GB+ RAM',
  },
] as const;

function DownloadPill({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      hitSlop={8}
      style={[styles.pill, { backgroundColor: theme.primaryMuted }]}
    >
      <Icon name="download" size={15} color={theme.primary} />
      <AppText variant="label" color="primary">
        Download
      </AppText>
    </PressableScale>
  );
}

export default function AiSettings() {
  const theme = useTheme();
  const toast = useToast();
  const [semantic, setSemantic] = useState(false);

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
            Models run locally. Your documents are never uploaded for indexing or search.
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
          subtitle="Understand queries, not only exact text"
          value={semantic}
          onValueChange={setSemantic}
        />
      </SettingGroup>

      <SettingGroup
        title="On-device models"
        footer="Downloads happen once, over Wi-Fi. Larger models need a more capable device."
        index={1}
      >
        {MODELS.map((m) => (
          <SettingRow
            key={m.id}
            icon="cpu"
            label={m.label}
            subtitle={m.subtitle}
            right={<DownloadPill onPress={() => toast.show(`Downloading ${m.label}…`)} />}
          />
        ))}
      </SettingGroup>

      <Button
        title="Re-index all documents"
        icon="refresh"
        variant="secondary"
        onPress={() => toast.show('Re-indexing started')}
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
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
});
