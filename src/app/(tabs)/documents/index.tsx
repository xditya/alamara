import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentCard } from '@/components/documents/document-card';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchBar } from '@/components/ui/search-bar';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { AppText } from '@/components/ui/text';
import { Durations, StaggerMs } from '@/constants/motion';
import { Spacing } from '@/constants/theme';
import { useDocuments } from '@/hooks/use-documents';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { go } from '@/lib/nav';
import { CATEGORY_LABELS, type DocCategory } from '@/types/models';

type Filter = DocCategory | 'all';
type Layout = 'grid' | 'list';

const H_PAD = Spacing.lg;
const GAP = Spacing.md;

const FILTERS: { key: Filter; label: string; category?: DocCategory }[] = [
  { key: 'all', label: 'All' },
  ...(Object.keys(CATEGORY_LABELS) as DocCategory[]).map((c) => ({
    key: c as Filter,
    label: CATEGORY_LABELS[c],
    category: c,
  })),
];

export default function DocumentsLibrary() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const { documents } = useDocuments();

  const [filter, setFilter] = useState<Filter>('all');
  const [layout, setLayout] = useState<Layout>('grid');

  const visible = useMemo(
    () => (filter === 'all' ? documents : documents.filter((d) => d.category === filter)),
    [documents, filter],
  );

  const itemWidth = (width - H_PAD * 2 - GAP) / 2;
  const enter = (i: number) => (reduced ? FadeIn : FadeInDown).duration(Durations.enter).delay(i * StaggerMs);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.bgGrouped }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <AppText variant="greeting">Documents</AppText>
          <AppText variant="body" color="textSecondary">
            {documents.length} {documents.length === 1 ? 'item' : 'items'} in your vault
          </AppText>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar value="" editable={false} onPressIn={() => go('/search')} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              category={f.category}
              active={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>

        <View style={styles.toolbar}>
          <AppText variant="label" color="textSecondary">
            {visible.length} {visible.length === 1 ? 'document' : 'documents'}
          </AppText>
          <View style={styles.segment}>
            <SegmentedControl<Layout>
              value={layout}
              onChange={setLayout}
              options={[
                { value: 'grid', icon: 'grid' },
                { value: 'list', icon: 'list' },
              ]}
            />
          </View>
        </View>

        {visible.length === 0 ? (
          <View style={styles.empty}>
            <EmptyState
              icon="folder"
              title="No documents yet"
              message={
                filter === 'all'
                  ? 'Scan or import a document to start building your vault.'
                  : `You have no ${CATEGORY_LABELS[filter as DocCategory]} documents yet.`
              }
            />
          </View>
        ) : layout === 'grid' ? (
          <View style={styles.grid}>
            {visible.map((doc, i) => (
              <Animated.View key={doc.id} entering={enter(i)} style={{ width: itemWidth }}>
                <DocumentCard document={doc} layout="grid" />
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.list}>
            {visible.map((doc, i) => (
              <Animated.View key={doc.id} entering={enter(i)}>
                <DocumentCard document={doc} layout="list" />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: H_PAD, paddingBottom: 120 },
  header: { paddingTop: Spacing.sm, gap: 2 },
  searchWrap: { marginTop: Spacing.lg },
  chipsScroll: { marginTop: Spacing.base, marginHorizontal: -H_PAD },
  chipsRow: { gap: Spacing.sm, paddingHorizontal: H_PAD },
  toolbar: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segment: { width: 108 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  list: { gap: GAP },
  empty: { marginTop: Spacing.huge },
});
