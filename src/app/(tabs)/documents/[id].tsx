import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View, type AlertButton } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CATEGORY_ICON } from '@/components/documents/document-card';
import { FieldRow } from '@/components/documents/field-row';
import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Durations, StaggerMs } from '@/constants/motion';
import { CardShadow, CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDocument } from '@/hooks/use-documents';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { backTo, goWith } from '@/lib/nav';
import * as db from '@/services/db';
import * as share from '@/services/share';
import { CATEGORY_LABELS } from '@/types/models';

export default function DocumentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const toast = useToast();
  const reduced = useReducedMotion();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const { document, loading, refresh } = useDocument(id);
  const [sharing, setSharing] = useState(false);

  const enter = (i: number) => (reduced ? FadeIn : FadeInDown).duration(Durations.enter).delay(i * StaggerMs);

  const BackButton = (
    <PressableScale
      onPress={() => backTo('/documents')}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }, CardShadow[scheme]]}
    >
      <Icon name="chevronLeft" size={22} color="text" />
    </PressableScale>
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.primary} />
      </SafeAreaView>
    );
  }

  if (!document) {
    return (
      <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.bg }]}>
        <View style={styles.topBar}>{BackButton}</View>
        <View style={styles.center}>
          <EmptyState
            icon="alert"
            title="Document not found"
            message="This document may have been deleted."
            actionLabel="Go back"
            onAction={() => backTo('/documents')}
          />
        </View>
      </SafeAreaView>
    );
  }

  const c = CategoryColors[scheme][document.category];
  const label = CATEGORY_LABELS[document.category];

  // Rendering a PDF takes a beat, so the button locks until the sheet is done.
  const runShare = async (task: () => Promise<void>, progress: string) => {
    if (sharing) return;
    setSharing(true);
    toast.show(progress);
    try {
      await task();
    } catch {
      toast.show('Could not share');
    } finally {
      setSharing(false);
    }
  };

  const onShare = () => {
    if (sharing) return;
    const images = share.imagePagesOf(document);
    const files = share.filePagesOf(document);

    // Details-only document — nothing to attach, so share the fields as text.
    if (files.length === 0) {
      void runShare(() => share.shareDocumentAsText(document), 'Sharing…');
      return;
    }
    // Already a PDF page: hand the file over as-is, just properly named.
    if (images.length === 0) {
      void runShare(() => share.shareDocumentPage(document, files[0]), 'Preparing…');
      return;
    }

    const multi = images.length > 1;
    const buttons: AlertButton[] = [
      {
        text: multi ? `PDF (all ${images.length} pages)` : 'PDF',
        onPress: () => void runShare(() => share.shareDocumentAsPdf(document), 'Making PDF…'),
      },
      {
        // Never silently drop pages — say so when only the first one goes out.
        text: multi ? 'Image (first page only)' : 'Image',
        onPress: () => void runShare(() => share.shareDocumentPage(document, images[0]), 'Preparing…'),
      },
      { text: 'Cancel', style: 'cancel' },
    ];
    Alert.alert('Share document', `How would you like to share “${document.name}”?`, buttons);
  };

  const onEdit = () => goWith('/review', { editId: document.id });

  const onAddPage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (res.canceled) return;
    const now = Date.now();
    const stored = await db.persistPages(`${document.id}-add${now}`, res.assets.map((a) => a.uri));
    const start = document.pages.length;
    const newPages = stored.map((uri, i) => ({ id: `${document.id}-p${start + i}`, uri }));
    await db.saveDocument({ ...document, pages: [...document.pages, ...newPages], updatedAt: now });
    toast.show(newPages.length > 1 ? 'Pages added' : 'Page added');
    refresh();
  };

  // A document must always keep at least one page — the last one can't be removed.
  const confirmRemovePage = (pageId: string, index: number) => {
    if (document.pages.length <= 1) {
      toast.show('A document needs at least one page');
      return;
    }
    Alert.alert(`Delete page ${index + 1}?`, 'The page and its image are removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const ok = await db.removePage(document.id, pageId);
          toast.show(ok ? 'Page deleted' : 'A document needs at least one page');
          refresh();
        },
      },
    ]);
  };

  const onDelete = async () => {
    await db.deleteDocument(document.id);
    toast.show('Deleted');
    backTo('/documents');
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>{BackButton}</View>

        {/* Category-tinted header */}
        <Animated.View entering={enter(0)} style={[styles.headerCard, { backgroundColor: c.tint }]}>
          <View style={[styles.headerIcon, { backgroundColor: theme.surface }]}>
            <Icon name={CATEGORY_ICON[document.category]} size={26} color={c.fg} />
          </View>
          <AppText variant="label" style={{ color: c.fg }}>
            {label.toUpperCase()}
          </AppText>
          <AppText variant="title" style={[styles.headerName, { color: theme.text }]}>
            {document.name}
          </AppText>
        </Animated.View>

        {/* Pages */}
        <Animated.View entering={enter(1)}>
          <AppText variant="section" style={styles.sectionTitle}>
            {document.pages.length} {document.pages.length === 1 ? 'Page' : 'Pages'}
          </AppText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pagesRow}
          >
            {document.pages.map((page, i) => {
              const isImage = !!page.uri && !page.uri.toLowerCase().endsWith('.pdf');
              return (
                <View key={page.id} style={styles.pageWrap}>
                  <PressableScale
                    onPress={() =>
                      goWith('/page-viewer', {
                        uri: page.uri,
                        name: document.name,
                        page: String(i + 1),
                        category: document.category,
                      })
                    }
                    style={[styles.pageTile, { backgroundColor: c.tint, borderColor: theme.border }]}
                  >
                    {isImage ? (
                      <Image source={{ uri: page.uri }} style={styles.pageImage} contentFit="cover" transition={150} />
                    ) : (
                      <Icon name="file" size={30} color={c.fg} />
                    )}
                    {page.side ? (
                      <AppText variant="caption" style={[styles.pageSide, { color: c.fg }]}>
                        {page.side === 'front' ? 'Front' : 'Back'}
                      </AppText>
                    ) : null}
                  </PressableScale>

                  {/* Re-crop a page that's already saved. */}
                  {isImage ? (
                    <PressableScale
                      onPress={() =>
                        goWith('/crop', { uri: page.uri, docId: document.id, pageId: page.id })
                      }
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={`Crop page ${i + 1}`}
                      style={[styles.pageCrop, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <Icon name="maximize" size={14} color="primary" />
                    </PressableScale>
                  ) : null}

                  {/* Only offered while more than one page remains. */}
                  {document.pages.length > 1 ? (
                    <PressableScale
                      onPress={() => confirmRemovePage(page.id, i)}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete page ${i + 1}`}
                      style={[styles.pageDelete, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                      <Icon name="close" size={14} color="danger" />
                    </PressableScale>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Fields */}
        {document.fields.length > 0 ? (
          <Animated.View entering={enter(2)}>
            <AppText variant="section" style={styles.sectionTitle}>
              Details
            </AppText>
            <View style={[styles.fieldCard, { backgroundColor: theme.surface, borderColor: theme.border }, CardShadow[scheme]]}>
              {document.fields.map((field, i) => (
                <View key={field.key}>
                  {i > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
                  <FieldRow field={field} />
                </View>
              ))}
            </View>
          </Animated.View>
        ) : null}

        {/* Tags */}
        {document.tags.length > 0 ? (
          <Animated.View entering={enter(3)}>
            <AppText variant="section" style={styles.sectionTitle}>
              Tags
            </AppText>
            <View style={styles.tagsRow}>
              {document.tags.map((tag) => (
                <Chip key={tag} label={tag} icon="tag" />
              ))}
            </View>
          </Animated.View>
        ) : null}

        {/* Actions */}
        <Animated.View entering={enter(4)} style={styles.actions}>
          <View style={styles.actionRow}>
            <View style={styles.actionItem}>
              <Button title="Share" icon="share" variant="secondary" loading={sharing} onPress={onShare} />
            </View>
            <View style={styles.actionItem}>
              <Button title="Edit" icon="edit" variant="secondary" onPress={onEdit} />
            </View>
          </View>
          <Button title="Add page" icon="plus" variant="ghost" onPress={onAddPage} />
          <Button title="Delete document" icon="trash" variant="danger" onPress={onDelete} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  topBar: { paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    borderRadius: Radius.card,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  headerName: { marginTop: 2 },
  sectionTitle: { marginTop: Spacing.xl, marginBottom: Spacing.md },
  pagesRow: { gap: Spacing.md, paddingRight: Spacing.lg },
  pageTile: {
    width: 128,
    height: 160,
    borderRadius: Radius.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  pageWrap: { position: 'relative' },
  pageCrop: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageDelete: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageImage: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  pageSide: {
    fontSize: 12,
    position: 'absolute',
    bottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  fieldCard: {
    borderRadius: Radius.card,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
  },
  divider: { height: 1, marginHorizontal: -Spacing.base },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actions: { marginTop: Spacing.xl, gap: Spacing.md },
  actionRow: { flexDirection: 'row', gap: Spacing.md },
  actionItem: { flex: 1 },
});
