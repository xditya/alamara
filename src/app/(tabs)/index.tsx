/**
 * Home dashboard [WP-C] — greeting, search entry, quick actions, "needs attention",
 * recently added, and category shortcuts. Staggered, calm, local-first.
 */

import { useMemo } from 'react';
import { ScrollView, StyleSheet, type ViewProps } from 'react-native';
import Animated, { FadeIn, FadeInDown, type AnimatedProps } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttentionCard } from '@/components/home/attention-card';
import { CategoryGrid } from '@/components/home/category-grid';
import { GreetingHeader } from '@/components/home/greeting-header';
import { HomeDocCard } from '@/components/home/home-doc-card';
import { QuickActions } from '@/components/home/quick-actions';
import { SectionHeader } from '@/components/home/section-header';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchBar } from '@/components/ui/search-bar';
import { Durations, Easings, StaggerMs } from '@/constants/motion';
import { Spacing } from '@/constants/theme';
import { useDocuments } from '@/hooks/use-documents';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { go } from '@/lib/nav';

const DAY = 86_400_000;
const ATTENTION_WINDOW_DAYS = 30;

/** Section entry: staggered slide-up, or a plain fade under reduced motion. */
function sectionEntering(index: number, reduced: boolean) {
  if (reduced) return FadeIn.duration(Durations.enter);
  return FadeInDown.duration(Durations.enter)
    .easing(Easings.out)
    .delay(index * StaggerMs)
    .withInitialValues({ transform: [{ translateY: 8 }] });
}

function Section({ index, reduced, ...rest }: AnimatedProps<ViewProps> & { index: number; reduced: boolean }) {
  return <Animated.View entering={sectionEntering(index, reduced)} {...rest} />;
}

export default function HomeScreen() {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const { documents } = useDocuments();

  const attention = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- benign render-time read of the clock for a time-based filter
    const now = Date.now();
    return documents
      .map((doc) => ({
        doc,
        days: doc.expiresAt != null ? Math.ceil((doc.expiresAt - now) / DAY) : undefined,
      }))
      .filter(({ doc, days }) => doc.status === 'pending' || (days != null && days <= ATTENTION_WINDOW_DAYS))
      .sort((a, b) => (a.days ?? -1000) - (b.days ?? -1000));
  }, [documents]);

  const recent = useMemo(
    () => [...documents].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8),
    [documents],
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.bgGrouped }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section index={0} reduced={reduced}>
          <GreetingHeader />
        </Section>

        <Section index={1} reduced={reduced}>
          <SearchBar onPress={() => go('/search')} placeholder="Search your vault" />
        </Section>

        <Section index={2} reduced={reduced}>
          <QuickActions />
        </Section>

        {attention.length > 0 ? (
          <Section index={3} reduced={reduced} style={styles.section}>
            <SectionHeader title="Needs attention" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.railBleed}
              contentContainerStyle={styles.rail}
            >
              {attention.map(({ doc, days }) => (
                <AttentionCard key={doc.id} doc={doc} days={days} />
              ))}
            </ScrollView>
          </Section>
        ) : null}

        <Section index={4} reduced={reduced} style={styles.section}>
          <SectionHeader title="Recently added" actionLabel="See all" onAction={() => go('/documents')} />
          {recent.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.railBleed}
              contentContainerStyle={styles.rail}
            >
              {recent.map((doc) => (
                <HomeDocCard key={doc.id} doc={doc} />
              ))}
            </ScrollView>
          ) : (
            <EmptyState
              icon="folder"
              title="No documents yet"
              message="Scan or import your first document to get started."
              actionLabel="Add a document"
              onAction={() => go('/capture')}
            />
          )}
        </Section>

        <Section index={5} reduced={reduced} style={styles.section}>
          <SectionHeader title="Browse by category" />
          <CategoryGrid documents={documents} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: 120,
    gap: Spacing.xl,
  },
  section: { gap: Spacing.md },
  railBleed: { marginHorizontal: -Spacing.base },
  rail: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingVertical: Spacing.xs },
});
