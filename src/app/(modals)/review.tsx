/**
 * Review & confirm — the second phase of the capture pipeline. Simulates a
 * freshly-captured document by running the deterministic classifier over a
 * sample OCR string, then lets the user correct the name, category, extracted
 * fields, and tags before saving into the vault.
 *
 * TODO(device): the sample OCR below is replaced by services/ocr.recognizeText()
 * run over the real captured page images.
 */

import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditableFieldRow } from '@/components/capture/editable-field-row';
import { PressableScale } from '@/components/pressable-scale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Durations } from '@/constants/motion';
import { CategoryColors, Radius, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { classify, extractFields, suggestName } from '@/lib/classify';
import { back, go } from '@/lib/nav';
import { saveDocument } from '@/services/db';
import { CATEGORY_LABELS, type DocCategory, type Document, type ExtractedField } from '@/types/models';

// Stand-in for OCR output from the captured pages. Classifies as a PAN card.
const SAMPLE_OCR = [
  'INCOME TAX DEPARTMENT',
  'GOVT. OF INDIA',
  'Permanent Account Number',
  'ABCDE1234F',
  'Name  ADITYA SHARMA',
  'Date of Birth  15/08/1998',
].join('\n');

const CATEGORY_ORDER: DocCategory[] = ['aadhaar', 'pan', 'id', 'ticket', 'certificate', 'other'];

export default function ReviewScreen() {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const toast = useToast();
  const reduced = useReducedMotion();

  const initial = useMemo(() => {
    const { category, confidence } = classify(SAMPLE_OCR);
    const fields = extractFields(SAMPLE_OCR, category);
    return { category, confidence, fields, name: suggestName(category, fields) };
  }, []);

  const [name, setName] = useState(initial.name);
  const [category, setCategory] = useState<DocCategory>(initial.category);
  const [fields, setFields] = useState<ExtractedField[]>(initial.fields);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const cat = CategoryColors[scheme][category];
  const confidencePct = Math.round(initial.confidence * 100);

  const setFieldValue = (i: number, value: string) =>
    setFields((fs) => fs.map((f, idx) => (idx === i ? { ...f, value } : f)));
  const removeField = (i: number) => setFields((fs) => fs.filter((_, idx) => idx !== i));
  const addField = () =>
    setFields((fs) => [...fs, { key: `custom-${Date.now()}`, label: 'Custom field', value: '' }]);

  const addTag = () => {
    const t = tagDraft.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagDraft('');
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    const finalName = name.trim() || CATEGORY_LABELS[category];
    const now = Date.now();
    const doc: Document = {
      id: `d${now}`,
      category,
      name: finalName,
      suggestedName: initial.name,
      status: 'ready',
      pages: [{ id: `p${now}`, uri: '' }],
      fields,
      tags,
      createdAt: now,
      updatedAt: now,
    };
    await saveDocument(doc);
    toast.show(`Saved as ${finalName}`);
    go('/documents');
  };

  const enter = (delay: number) =>
    reduced ? FadeIn.duration(Durations.enter) : FadeInDown.delay(delay).duration(Durations.enter);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale onPress={back} style={styles.iconBtn} hitSlop={8}>
          <Icon name="close" size={22} color={theme.text} />
        </PressableScale>
        <AppText variant="section">Review &amp; confirm</AppText>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Detection summary */}
          <Animated.View entering={enter(0)}>
            <Card>
              <View style={styles.summary}>
                <View style={[styles.summaryTile, { backgroundColor: cat.tint }]}>
                  <Icon name="file" size={26} color={cat.fg} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="section" numberOfLines={1}>
                    {name || CATEGORY_LABELS[category]}
                  </AppText>
                  <View style={styles.detectRow}>
                    <Badge label={CATEGORY_LABELS[category]} tone="primary" />
                    <AppText variant="caption" color="textSecondary">
                      Detected · {confidencePct}% match
                    </AppText>
                  </View>
                </View>
              </View>
            </Card>
          </Animated.View>

          {/* Name */}
          <Animated.View entering={enter(40)} style={styles.section}>
            <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
              DOCUMENT NAME
            </AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Name this document"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.nameInput,
                { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            />
          </Animated.View>

          {/* Category */}
          <Animated.View entering={enter(80)} style={styles.section}>
            <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
              CATEGORY
            </AppText>
            <View style={styles.chips}>
              {CATEGORY_ORDER.map((c) => (
                <Chip
                  key={c}
                  label={CATEGORY_LABELS[c]}
                  category={c}
                  active={c === category}
                  onPress={() => setCategory(c)}
                />
              ))}
            </View>
          </Animated.View>

          {/* Fields */}
          <Animated.View entering={enter(120)} style={styles.section}>
            <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
              EXTRACTED FIELDS
            </AppText>
            <View style={styles.fields}>
              {fields.length === 0 ? (
                <AppText variant="caption" color="textSecondary">
                  No fields detected. Add one below.
                </AppText>
              ) : (
                fields.map((f, i) => (
                  <EditableFieldRow
                    key={f.key}
                    label={f.label}
                    value={f.value}
                    mono={f.mono}
                    onChangeValue={(v) => setFieldValue(i, v)}
                    onRemove={() => removeField(i)}
                  />
                ))
              )}
              <PressableScale onPress={addField} style={styles.addField}>
                <Icon name="plus" size={16} color={theme.primary} />
                <AppText variant="label" style={{ color: theme.primary }}>
                  Add field
                </AppText>
              </PressableScale>
            </View>
          </Animated.View>

          {/* Tags */}
          <Animated.View entering={enter(160)} style={styles.section}>
            <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
              TAGS
            </AppText>
            {tags.length > 0 ? (
              <View style={styles.chips}>
                {tags.map((t) => (
                  <PressableScale
                    key={t}
                    onPress={() => removeTag(t)}
                    style={[styles.tag, { backgroundColor: theme.primaryMuted }]}
                  >
                    <AppText variant="label" style={{ color: theme.primary }}>
                      {t}
                    </AppText>
                    <Icon name="close" size={14} color={theme.primary} />
                  </PressableScale>
                ))}
              </View>
            ) : null}
            <TextInput
              value={tagDraft}
              onChangeText={setTagDraft}
              onSubmitEditing={addTag}
              returnKeyType="done"
              blurOnSubmit={false}
              placeholder="Add a tag and press return"
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.nameInput,
                styles.tagInput,
                { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}
            />
          </Animated.View>
        </ScrollView>

        {/* Save bar */}
        <View style={[styles.saveBar, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
          <Button title="Save to Alamara" icon="check" onPress={onSave} loading={saving} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.xl },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  summaryTile: {
    width: 56,
    height: 56,
    borderRadius: Radius.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  section: { gap: Spacing.sm },
  sectionLabel: { letterSpacing: 0.6 },
  nameInput: {
    borderRadius: Radius.input,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    minHeight: 48,
    fontSize: 16,
  },
  tagInput: { marginTop: Spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  fields: { gap: Spacing.base },
  addField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  saveBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
  },
});
