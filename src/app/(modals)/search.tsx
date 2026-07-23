/**
 * Search modal [WP-C] — debounced full-text search over the vault via
 * `db.searchDocuments`, with optional category filter chips.
 */

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchResultRow } from '@/components/home/search-result-row';
import { PressableScale } from '@/components/pressable-scale';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchBar } from '@/components/ui/search-bar';
import { AppText } from '@/components/ui/text';
import { Durations, Easings, StaggerMs } from '@/constants/motion';
import { Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { back } from '@/lib/nav';
import { usePreferences } from '@/lib/theme-store';
import { isEmbedderReady, semanticSearch, warmUpEmbedder } from '@/services/ai';
import { listDocuments, searchDocuments } from '@/services/db';
import { CATEGORY_LABELS, type DocCategory, type Document } from '@/types/models';

const DEBOUNCE_MS = 200;

export default function SearchModal() {
  const theme = useTheme();
  const reduced = useReducedMotion();

  const { aiEnabled } = usePreferences();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCat, setActiveCat] = useState<DocCategory | null>(null);

  const [embedderReady, setEmbedderReady] = useState(isEmbedderReady());

  const semantic = aiEnabled && embedderReady;

  // The loaded module is lost on every app restart while the downloaded model
  // file is not, so reload it here — otherwise search silently drops back to
  // keyword-only until the user reopens AI settings.
  useEffect(() => {
    if (!aiEnabled || embedderReady) return;
    let cancelled = false;
    void warmUpEmbedder()
      .catch(() => false)
      .then((loaded) => {
        if (!cancelled && loaded) setEmbedderReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [aiEnabled, embedderReady]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      // Keyword (FTS-style) matches first; then blend in semantic matches (by meaning).
      const fts = await searchDocuments(q);
      let merged = fts;
      if (semantic) {
        try {
          const all = await listDocuments();
          const sem = await semanticSearch(q, all);
          const seen = new Set(fts.map((d) => d.id));
          merged = [...fts, ...sem.filter((d) => !seen.has(d.id))];
        } catch {
          // semantic unavailable — keep keyword results
        }
      }
      if (!cancelled) {
        setResults(merged);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, semantic]);

  // Category chips reflect only the categories actually present in the results.
  const availableCats = useMemo(() => {
    const seen: DocCategory[] = [];
    for (const d of results) if (!seen.includes(d.category)) seen.push(d.category);
    return seen;
  }, [results]);

  const filtered = useMemo(
    () => (activeCat ? results.filter((d) => d.category === activeCat) : results),
    [results, activeCat],
  );

  // Drop a stale category filter once it's no longer among the results.
  useEffect(() => {
    if (activeCat && !availableCats.includes(activeCat)) setActiveCat(null);
  }, [activeCat, availableCats]);

  const hasQuery = query.trim().length > 0;

  const rowEntering = (index: number) =>
    reduced
      ? FadeIn.duration(Durations.enter)
      : FadeInDown.duration(Durations.enter)
          .easing(Easings.out)
          .delay(Math.min(index, 8) * StaggerMs)
          .withInitialValues({ transform: [{ translateY: 8 }] });

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            autoFocus
            placeholder="Search by name, number, or tag"
          />
        </View>
        <PressableScale onPress={back} style={styles.cancel} hitSlop={8}>
          <AppText variant="label" color="primary">
            Cancel
          </AppText>
        </PressableScale>
      </View>

      {hasQuery && availableCats.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsBleed}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          <Chip label="All" active={activeCat === null} onPress={() => setActiveCat(null)} />
          {availableCats.map((cat) => (
            <Chip
              key={cat}
              label={CATEGORY_LABELS[cat]}
              category={cat}
              active={activeCat === cat}
              onPress={() => setActiveCat(cat)}
            />
          ))}
        </ScrollView>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.results}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {!hasQuery ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="search"
              title="Search your vault"
              message="Find any document by its name, ID number, or tag."
            />
          </View>
        ) : loading && filtered.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon="search"
              title="No matches"
              message={`Nothing found for “${query.trim()}”. Try a different name or number.`}
            />
          </View>
        ) : (
          filtered.map((doc, i) => (
            <Animated.View key={doc.id} entering={rowEntering(i)}>
              <SearchResultRow doc={doc} query={query} />
            </Animated.View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  searchWrap: { flex: 1 },
  cancel: { paddingHorizontal: Spacing.xs, paddingVertical: Spacing.sm, minHeight: 44, justifyContent: 'center' },
  chipsBleed: { flexGrow: 0 },
  chips: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.base, paddingBottom: Spacing.sm },
  results: { paddingHorizontal: Spacing.base, paddingTop: Spacing.xs, paddingBottom: 120, gap: Spacing.sm },
  emptyWrap: { paddingTop: Spacing.huge },
  loading: { paddingTop: Spacing.huge, alignItems: 'center' },
});
