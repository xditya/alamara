/**
 * Page viewer — a full-screen look at a captured page. Page images are stored as
 * encrypted blobs and decrypted to cache on device; here (no native) we render a
 * large category-tinted placeholder in their place.
 *
 * TODO(device): services/crypto.decryptToCache() → <Image> of the real page.
 */

import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Durations } from '@/constants/motion';
import { CategoryColors, Radius, Spacing, type DocCategory } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { back } from '@/lib/nav';

const CATEGORIES: DocCategory[] = ['aadhaar', 'pan', 'id', 'ticket', 'certificate', 'other'];

export default function PageViewerScreen() {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const toast = useToast();
  const reduced = useReducedMotion();

  const params = useLocalSearchParams<{ category?: string; name?: string; page?: string }>();
  const category: DocCategory = CATEGORIES.includes(params.category as DocCategory)
    ? (params.category as DocCategory)
    : 'other';
  const title = params.name ?? 'Document';
  const pageLabel = params.page ? `Page ${params.page}` : 'Page 1';
  const cat = CategoryColors[scheme][category];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bgGrouped }]} edges={['top', 'bottom']}>
      {/* Top bar */}
      <View style={styles.bar}>
        <PressableScale onPress={back} style={[styles.iconBtn, { backgroundColor: theme.surface }]} hitSlop={8}>
          <Icon name="close" size={22} color={theme.text} />
        </PressableScale>
        <View style={styles.barTitle}>
          <AppText variant="section" numberOfLines={1}>
            {title}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {pageLabel}
          </AppText>
        </View>
        <PressableScale
          onPress={() => toast.show('Preparing to share…')}
          style={[styles.iconBtn, { backgroundColor: theme.surface }]}
          hitSlop={8}
        >
          <Icon name="share" size={20} color={theme.text} />
        </PressableScale>
      </View>

      {/* Placeholder page */}
      <View style={styles.body}>
        <Animated.View
          entering={reduced ? FadeIn.duration(Durations.enter) : FadeIn.duration(Durations.page)}
          style={[styles.page, { backgroundColor: cat.tint, borderColor: theme.border }]}
        >
          <View style={[styles.pageIcon, { backgroundColor: theme.surface }]}>
            <Icon name="file" size={40} color={cat.fg} />
          </View>
          <AppText variant="body" style={{ color: cat.fg }}>
            {title}
          </AppText>
          <AppText variant="caption" color="textSecondary" style={styles.pageNote}>
            Preview opens on a device build
          </AppText>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTitle: { flex: 1 },
  body: { flex: 1, padding: Spacing.lg, alignItems: 'center', justifyContent: 'center' },
  page: {
    width: '100%',
    aspectRatio: 0.7,
    maxWidth: 420,
    borderRadius: Radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    padding: Spacing.xl,
  },
  pageIcon: {
    width: 88,
    height: 88,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNote: { textAlign: 'center' },
});
