/**
 * Review & confirm — the second phase of the capture pipeline, also reused to EDIT
 * an existing document (via the `editId` param). Takes the file(s) picked in the
 * capture chooser (or an existing document's pages), shows a real preview, and lets
 * the user set the name, category, fields, tags — plus event date/venue/seat for
 * tickets — before the document is copied into (or updated in) the vault.
 *
 * TODO(native): run services/ocr.recognizeText() over the pages to pre-fill the
 * category and extracted fields automatically (ML Kit / VisionKit — needs a device
 * build). Until then the user categorises manually; everything else is real.
 */

import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { back } from '@/lib/nav';
import * as db from '@/services/db';
import { recognizeText } from '@/services/ocr';
import {
  CATEGORY_LABELS,
  type DocCategory,
  type Document,
  type ExtractedField,
  type Ticket,
} from '@/types/models';

const CATEGORY_ORDER: DocCategory[] = ['aadhaar', 'pan', 'id', 'ticket', 'certificate', 'other'];

function parseUris(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const value = Array.isArray(raw) ? raw[0] : raw;
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === 'string') : [];
  } catch {
    return [];
  }
}

function isPdf(uri: string): boolean {
  return uri.split('?')[0].toLowerCase().endsWith('.pdf');
}

function formatEventAt(ts: number): string {
  const d = new Date(ts);
  const date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

export default function ReviewScreen() {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const toast = useToast();
  const reduced = useReducedMotion();

  const params = useLocalSearchParams<{ uris?: string; source?: string; editId?: string }>();
  const editId = params.editId || undefined;
  const isEditing = !!editId;
  const pickedUris = useMemo(() => parseUris(params.uris), [params.uris]);
  const source = params.source || 'Imported';

  const [loadedDoc, setLoadedDoc] = useState<Document | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocCategory>('other');
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [saving, setSaving] = useState(false);

  // Ticket-only details.
  const [eventAt, setEventAt] = useState<number | null>(null);
  const [venue, setVenue] = useState('');
  const [seat, setSeat] = useState('');
  const [picker, setPicker] = useState<null | 'date' | 'time'>(null);
  // Seeded from an event handler (not render) so the picker always has a concrete
  // starting value without calling Date.now() during render.
  const [pickerSeed, setPickerSeed] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const didAnalyze = useRef(false);

  // Prefill everything when editing an existing document.
  useEffect(() => {
    if (!editId) return;
    let mounted = true;
    Promise.all([db.getDocument(editId), db.listTickets()]).then(([doc, tickets]) => {
      if (!mounted || !doc) return;
      setLoadedDoc(doc);
      setName(doc.name);
      setCategory(doc.category);
      setFields(doc.fields);
      setTags(doc.tags);
      const tk = tickets.find((t) => t.documentId === editId);
      if (tk) {
        setEventAt(tk.eventAt);
        setVenue(tk.venue ?? '');
        setSeat(tk.seat ?? '');
      }
    });
    return () => {
      mounted = false;
    };
  }, [editId]);

  // Auto-index a freshly captured page: OCR → classify → extract fields → suggest a
  // name. Runs once, and only fills values the user hasn't already set.
  useEffect(() => {
    if (isEditing || didAnalyze.current) return;
    const first = pickedUris[0];
    if (!first || isPdf(first)) return;
    didAnalyze.current = true;
    let mounted = true;
    setAnalyzing(true);
    recognizeText(first)
      .then(({ text }) => {
        if (!mounted || !text.trim()) return;
        const detected = classify(text);
        const detectedFields = extractFields(text, detected.category);
        setCategory((prev) => (prev === 'other' ? detected.category : prev));
        setFields((prev) => (prev.length === 0 ? detectedFields : prev));
        setName((prev) => prev || suggestName(detected.category, detectedFields));
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setAnalyzing(false);
      });
    return () => {
      mounted = false;
    };
  }, [isEditing, pickedUris]);

  const displayUris = loadedDoc ? loadedDoc.pages.map((p) => p.uri).filter(Boolean) : pickedUris;
  const pageCount = loadedDoc ? loadedDoc.pages.length : Math.max(pickedUris.length, 1);
  const firstUri = displayUris[0];
  const cat = CategoryColors[scheme][category];

  const setFieldValue = (i: number, value: string) =>
    setFields((fs) => fs.map((f, idx) => (idx === i ? { ...f, value } : f)));
  const removeField = (i: number) => setFields((fs) => fs.filter((_, idx) => idx !== i));
  const addField = () =>
    setFields((fs) => [...fs, { key: `custom-${fs.length}-${Date.now()}`, label: 'Detail', value: '', copyable: true }]);

  const addTag = () => {
    const t = tagDraft.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagDraft('');
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  // Android shows date then time in sequence; iOS shows an inline spinner per mode.
  const onPickDateTime = (event: DateTimePickerEvent, selected?: Date) => {
    if (event.type === 'dismissed' || !selected) {
      setPicker(null);
      return;
    }
    const base = new Date(eventAt ?? Date.now());
    if (picker === 'date') {
      base.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setEventAt(base.getTime());
      setPicker(Platform.OS === 'android' ? 'time' : null);
    } else {
      base.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setEventAt(base.getTime());
      setPicker(null);
    }
  };

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const now = Date.now();
      const id = editId ?? `d${now}`;
      const finalName = name.trim() || CATEGORY_LABELS[category];
      const createdAt = loadedDoc?.createdAt ?? now;

      // Existing pages are already persisted; only copy freshly-picked files.
      let pages;
      if (isEditing && loadedDoc) {
        pages = loadedDoc.pages;
      } else {
        const storedUris = pickedUris.length > 0 ? await db.persistPages(id, pickedUris) : [];
        pages = storedUris.length
          ? storedUris.map((uri, i) => ({ id: `${id}-p${i}`, uri }))
          : [{ id: `${id}-p0`, uri: '' }];
      }

      const cleanFields = fields.filter((f) => f.value.trim().length > 0);

      const doc: Document = {
        id,
        category,
        name: finalName,
        status: 'ready',
        pages,
        fields: cleanFields,
        tags,
        createdAt,
        updatedAt: now,
        expiresAt: category === 'ticket' && eventAt ? eventAt : loadedDoc?.expiresAt,
      };
      await db.saveDocument(doc);

      // Keep Wallet in sync: clear old ticket(s), then (re)create if still a ticket.
      if (isEditing) await db.removeTicketsForDocument(id);
      if (category === 'ticket') {
        const when = eventAt ?? now;
        const ticket: Ticket = {
          id: `tk-${id}`,
          documentId: id,
          eventTitle: finalName,
          eventAt: when,
          venue: venue.trim() || undefined,
          seat: seat.trim() || undefined,
          barcodeValue: cleanFields.find((f) => f.mono)?.value ?? finalName,
          barcodeFormat: 'qr',
          status: when >= now ? 'upcoming' : 'past',
        };
        await db.saveTicket(ticket);
      }

      toast.show(isEditing ? 'Changes saved' : `Saved as ${finalName}`);
      back();
    } catch {
      setSaving(false);
      toast.show('Could not save this document');
    }
  };

  const enter = (delay: number) =>
    reduced ? FadeIn.duration(Durations.enter) : FadeInDown.delay(delay).duration(Durations.enter);

  const inputStyle = [
    styles.textInput,
    { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <PressableScale onPress={back} style={styles.iconBtn} hitSlop={8}>
          <Icon name="close" size={22} color={theme.text} />
        </PressableScale>
        <AppText variant="section">{isEditing ? 'Edit document' : 'Review & confirm'}</AppText>
        <View style={styles.iconBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Preview + summary */}
          <Animated.View entering={enter(0)}>
            <Card>
              <View style={styles.summary}>
                <View style={[styles.summaryTile, { backgroundColor: cat.tint }]}>
                  {firstUri && !isPdf(firstUri) ? (
                    <Image source={{ uri: firstUri }} style={styles.thumb} contentFit="cover" transition={120} />
                  ) : (
                    <Icon name="file" size={26} color={cat.fg} />
                  )}
                </View>
                <View style={styles.flex}>
                  <AppText variant="section" numberOfLines={1}>
                    {name || CATEGORY_LABELS[category]}
                  </AppText>
                  <View style={styles.detectRow}>
                    <Badge label={CATEGORY_LABELS[category]} tone="primary" />
                    <AppText variant="caption" color="textSecondary">
                      {analyzing
                        ? 'Reading document…'
                        : `${pageCount} ${pageCount === 1 ? 'page' : 'pages'} · ${isEditing ? 'Editing' : source}`}
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
              placeholder={`e.g. ${CATEGORY_LABELS[category]}`}
              placeholderTextColor={theme.textSecondary}
              style={inputStyle}
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

          {/* Ticket-only: event details */}
          {category === 'ticket' ? (
            <Animated.View entering={enter(100)} style={styles.section}>
              <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
                EVENT DETAILS
              </AppText>
              <PressableScale
                onPress={() => {
                  setPickerSeed(eventAt ?? Date.now());
                  setPicker('date');
                }}
                style={[inputStyle, styles.dateRow]}
              >
                <Icon name="calendar" size={18} color={eventAt ? theme.primary : theme.textSecondary} />
                <AppText variant="body" color={eventAt ? 'text' : 'textSecondary'}>
                  {eventAt ? formatEventAt(eventAt) : 'Set date & time'}
                </AppText>
              </PressableScale>
              <TextInput
                value={venue}
                onChangeText={setVenue}
                placeholder="Venue"
                placeholderTextColor={theme.textSecondary}
                style={[inputStyle, styles.stackedInput]}
              />
              <TextInput
                value={seat}
                onChangeText={setSeat}
                placeholder="Seat / section (optional)"
                placeholderTextColor={theme.textSecondary}
                style={[inputStyle, styles.stackedInput]}
              />
              {picker ? (
                <DateTimePicker value={new Date(eventAt ?? pickerSeed)} mode={picker} onChange={onPickDateTime} />
              ) : null}
            </Animated.View>
          ) : null}

          {/* Fields */}
          <Animated.View entering={enter(120)} style={styles.section}>
            <AppText variant="label" color="textSecondary" style={styles.sectionLabel}>
              DETAILS
            </AppText>
            <View style={styles.fields}>
              {fields.length === 0 ? (
                <AppText variant="caption" color="textSecondary">
                  Add any details you want to copy later (ID number, booking ID, etc.).
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
                  Add detail
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
              submitBehavior="submit"
              placeholder="Add a tag and press return"
              placeholderTextColor={theme.textSecondary}
              style={[inputStyle, styles.stackedInput]}
            />
          </Animated.View>
        </ScrollView>

        {/* Save bar */}
        <View style={[styles.saveBar, { borderTopColor: theme.border, backgroundColor: theme.bg }]}>
          <Button
            title={isEditing ? 'Save changes' : 'Save to Alamara'}
            icon="check"
            onPress={onSave}
            loading={saving}
          />
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
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  detectRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  section: { gap: Spacing.sm },
  sectionLabel: { letterSpacing: 0.6 },
  textInput: {
    borderRadius: Radius.input,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    minHeight: 48,
    fontSize: 16,
  },
  stackedInput: { marginTop: Spacing.sm },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
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
