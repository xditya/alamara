/**
 * Crop — free-form rectangular cropping with draggable corners AND edges.
 *
 * The aspect ratio is never locked: every corner and edge moves independently,
 * clamped to the image bounds and a minimum size. Fresh scans arrive already cropped
 * by the OS scanner, so this screen exists to re-crop a page that is *already saved*,
 * reached from a document's page menu. Leaving with unsaved changes asks first.
 *
 * Params:
 *  - uri             the image to crop (required)
 *  - docId, pageId   the saved page this replaces in place (required)
 */

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image as RNImage, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Radius, Spacing } from '@/constants/theme';
import { back } from '@/lib/nav';
import * as db from '@/services/db';

// The crop surface is a deliberately dark stage so the photo reads clearly —
// these local constants are the one place raw colours are used.
const STAGE = '#0A0A0C';
const ON_DARK = '#FFFFFF';
const DIM = 'rgba(0,0,0,0.55)';
const CONTROL_BG = 'rgba(255,255,255,0.12)';

const MIN_SIZE = 60; // smallest crop box, in on-screen points
const HANDLE = 28;

export default function CropScreen() {
  const params = useLocalSearchParams<{ uri?: string; docId?: string; pageId?: string }>();
  const uri = params.uri ?? '';
  const docId = params.docId ?? '';
  const pageId = params.pageId ?? '';
  const toast = useToast();

  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState({ w: 0, h: 0 });
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Crop rectangle edges, in stage coordinates.
  const l = useSharedValue(0);
  const t = useSharedValue(0);
  const r = useSharedValue(0);
  const b = useSharedValue(0);
  // Image bounds within the stage (shared so gestures can clamp on the UI thread).
  const bl = useSharedValue(0);
  const bt = useSharedValue(0);
  const br = useSharedValue(0);
  const bb = useSharedValue(0);
  /**
   * Where the box was when the current drag started. These have to be shared values,
   * not plain `let`s in the enclosing scope: `onStart` and `onUpdate` are compiled into
   * separate worklets, each of which captures its own copy of any outer variable it
   * reads. Anything `onStart` assigned to a `let` would therefore still read as 0 in
   * `onUpdate`, so every drag measured its delta from the origin and slammed the crop
   * box into the top-left corner.
   */
  const s0l = useSharedValue(0);
  const s0t = useSharedValue(0);
  const s0r = useSharedValue(0);
  const s0b = useSharedValue(0);

  useEffect(() => {
    if (!uri) return;
    RNImage.getSize(
      uri,
      (w, h) => setNatural({ w, h }),
      () => setNatural(null),
    );
  }, [uri]);

  // Fit the image into the stage (contain), and remember the scale back to pixels.
  const fit = useMemo(() => {
    if (!natural || !stage.w || !stage.h) return null;
    const s = Math.min(stage.w / natural.w, stage.h / natural.h);
    const w = natural.w * s;
    const h = natural.h * s;
    return { x: (stage.w - w) / 2, y: (stage.h - h) / 2, w, h, toPixels: natural.w / w };
  }, [natural, stage]);

  const resetCrop = useCallback(() => {
    if (!fit) return;
    bl.value = fit.x;
    bt.value = fit.y;
    br.value = fit.x + fit.w;
    bb.value = fit.y + fit.h;
    l.value = fit.x;
    t.value = fit.y;
    r.value = fit.x + fit.w;
    b.value = fit.y + fit.h;
  }, [fit, b, bb, bl, br, bt, l, r, t]);

  useEffect(() => {
    resetCrop();
  }, [resetCrop]);

  const markDirty = useCallback(() => setDirty(true), []);

  // --- gestures -------------------------------------------------------------
  // Body: move the whole box, keeping it inside the image.
  const bodyPan = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          s0l.value = l.value;
          s0t.value = t.value;
          s0r.value = r.value;
          s0b.value = b.value;
        })
        .onUpdate((e) => {
          const w = s0r.value - s0l.value;
          const h = s0b.value - s0t.value;
          const nx = Math.max(bl.value, Math.min(s0l.value + e.translationX, br.value - w));
          const ny = Math.max(bt.value, Math.min(s0t.value + e.translationY, bb.value - h));
          l.value = nx;
          t.value = ny;
          r.value = nx + w;
          b.value = ny + h;
        })
        .onEnd(() => runOnJS(markDirty)()),
    [b, bb, bl, br, bt, l, markDirty, r, s0b, s0l, s0r, s0t, t],
  );

  /**
   * Builds a pan gesture that moves the given edges. `blocksExternalGesture(bodyPan)`
   * makes the body pan wait for this one: the handles sit inside the box, so without
   * it a corner drag would also drag the whole box.
   */
  const edgeGesture = useCallback(
    (moveLeft: boolean, moveTop: boolean, moveRight: boolean, moveBottom: boolean) =>
      Gesture.Pan()
        .blocksExternalGesture(bodyPan)
        .onStart(() => {
          s0l.value = l.value;
          s0t.value = t.value;
          s0r.value = r.value;
          s0b.value = b.value;
        })
        .onUpdate((e) => {
          if (moveLeft) l.value = Math.max(bl.value, Math.min(s0l.value + e.translationX, r.value - MIN_SIZE));
          if (moveTop) t.value = Math.max(bt.value, Math.min(s0t.value + e.translationY, b.value - MIN_SIZE));
          if (moveRight) r.value = Math.min(br.value, Math.max(s0r.value + e.translationX, l.value + MIN_SIZE));
          if (moveBottom) b.value = Math.min(bb.value, Math.max(s0b.value + e.translationY, t.value + MIN_SIZE));
        })
        .onEnd(() => runOnJS(markDirty)()),
    [b, bb, bl, bodyPan, br, bt, l, markDirty, r, s0b, s0l, s0r, s0t, t],
  );

  const gTL = useMemo(() => edgeGesture(true, true, false, false), [edgeGesture]);
  const gTR = useMemo(() => edgeGesture(false, true, true, false), [edgeGesture]);
  const gBL = useMemo(() => edgeGesture(true, false, false, true), [edgeGesture]);
  const gBR = useMemo(() => edgeGesture(false, false, true, true), [edgeGesture]);
  const gT = useMemo(() => edgeGesture(false, true, false, false), [edgeGesture]);
  const gB = useMemo(() => edgeGesture(false, false, false, true), [edgeGesture]);
  const gL = useMemo(() => edgeGesture(true, false, false, false), [edgeGesture]);
  const gR = useMemo(() => edgeGesture(false, false, true, false), [edgeGesture]);

  // --- animated styles ------------------------------------------------------
  const boxStyle = useAnimatedStyle(() => ({
    left: l.value,
    top: t.value,
    width: Math.max(0, r.value - l.value),
    height: Math.max(0, b.value - t.value),
  }));
  const dimTop = useAnimatedStyle(() => ({ left: 0, top: 0, right: 0, height: Math.max(0, t.value) }));
  const dimBottom = useAnimatedStyle(() => ({ left: 0, top: b.value, right: 0, bottom: 0 }));
  const dimLeft = useAnimatedStyle(() => ({
    left: 0,
    top: t.value,
    width: Math.max(0, l.value),
    height: Math.max(0, b.value - t.value),
  }));
  const dimRight = useAnimatedStyle(() => ({
    left: r.value,
    top: t.value,
    right: 0,
    height: Math.max(0, b.value - t.value),
  }));

  const corner = (extra: object) => [styles.handle, extra];

  // --- save / exit ----------------------------------------------------------
  const applyCrop = async (): Promise<string | null> => {
    if (!fit || !natural) return null;
    const s = fit.toPixels;
    const originX = Math.max(0, Math.round((l.value - fit.x) * s));
    const originY = Math.max(0, Math.round((t.value - fit.y) * s));
    const width = Math.min(natural.w - originX, Math.round((r.value - l.value) * s));
    const height = Math.min(natural.h - originY, Math.round((b.value - t.value) * s));
    if (width <= 0 || height <= 0) return null;
    const rendered = await ImageManipulator.manipulate(uri)
      .crop({ originX, originY, width, height })
      .renderAsync();
    const out = await rendered.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });
    return out.uri;
  };

  const onSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const cropped = (await applyCrop()) ?? uri;
      await db.replacePage(docId, pageId, cropped);
      toast.show('Page updated');
      back();
    } catch {
      setSaving(false);
      toast.show('Could not crop this image');
    }
  };

  const onClose = () => {
    if (!dirty) {
      back();
      return;
    }
    Alert.alert('Discard changes?', 'Your crop has not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: back },
      { text: 'Save', onPress: () => void onSave() },
    ]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <PressableScale onPress={onClose} style={styles.control} hitSlop={8} accessibilityLabel="Close">
            <Icon name="close" size={22} color={ON_DARK} />
          </PressableScale>
          <AppText variant="section" style={{ color: ON_DARK }}>
            Crop
          </AppText>
          <PressableScale onPress={resetCrop} style={styles.control} hitSlop={8} accessibilityLabel="Reset crop">
            <Icon name="refresh" size={20} color={ON_DARK} />
          </PressableScale>
        </View>

        <View
          style={styles.stage}
          onLayout={(e) => setStage({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        >
          {uri ? (
            <RNImage source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          ) : null}

          {fit ? (
            <>
              {/* Dim everything outside the crop box */}
              <Animated.View pointerEvents="none" style={[styles.dim, dimTop]} />
              <Animated.View pointerEvents="none" style={[styles.dim, dimBottom]} />
              <Animated.View pointerEvents="none" style={[styles.dim, dimLeft]} />
              <Animated.View pointerEvents="none" style={[styles.dim, dimRight]} />

              {/* The crop box: drag to move, handles to resize */}
              <GestureDetector gesture={bodyPan}>
                <Animated.View style={[styles.box, boxStyle]}>
                  <View style={styles.gridRow} pointerEvents="none" />
                  <View style={[styles.gridRow, styles.gridRow2]} pointerEvents="none" />
                  <View style={styles.gridCol} pointerEvents="none" />
                  <View style={[styles.gridCol, styles.gridCol2]} pointerEvents="none" />

                  {/* Edges */}
                  <GestureDetector gesture={gT}>
                    <View style={[styles.edgeH, { top: -HANDLE / 2 }]} />
                  </GestureDetector>
                  <GestureDetector gesture={gB}>
                    <View style={[styles.edgeH, { bottom: -HANDLE / 2 }]} />
                  </GestureDetector>
                  <GestureDetector gesture={gL}>
                    <View style={[styles.edgeV, { left: -HANDLE / 2 }]} />
                  </GestureDetector>
                  <GestureDetector gesture={gR}>
                    <View style={[styles.edgeV, { right: -HANDLE / 2 }]} />
                  </GestureDetector>

                  {/* Corners */}
                  <GestureDetector gesture={gTL}>
                    <View style={corner({ top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 })} />
                  </GestureDetector>
                  <GestureDetector gesture={gTR}>
                    <View style={corner({ top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 })} />
                  </GestureDetector>
                  <GestureDetector gesture={gBL}>
                    <View style={corner({ bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 })} />
                  </GestureDetector>
                  <GestureDetector gesture={gBR}>
                    <View style={corner({ bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 })} />
                  </GestureDetector>
                </Animated.View>
              </GestureDetector>
            </>
          ) : (
            <View style={styles.center}>
              <ActivityIndicator color={ON_DARK} />
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <AppText variant="caption" style={styles.hint}>
            Drag the corners or edges — the crop is not locked to a shape.
          </AppText>
          <Button
            title="Save changes"
            icon="check"
            onPress={onSave}
            loading={saving}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: STAGE },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  control: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CONTROL_BG,
  },
  stage: { flex: 1, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dim: { position: 'absolute', backgroundColor: DIM },
  box: { position: 'absolute', borderWidth: 1, borderColor: ON_DARK },
  handle: {
    position: 'absolute',
    width: HANDLE,
    height: HANDLE,
    borderColor: ON_DARK,
  },
  edgeH: { position: 'absolute', left: HANDLE, right: HANDLE, height: HANDLE },
  edgeV: { position: 'absolute', top: HANDLE, bottom: HANDLE, width: HANDLE },
  gridRow: { position: 'absolute', left: 0, right: 0, top: '33.33%', height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  gridRow2: { top: '66.66%' },
  gridCol: { position: 'absolute', top: 0, bottom: 0, left: '33.33%', width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  gridCol2: { left: '66.66%' },
  footer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.base, gap: Spacing.md },
  hint: { color: 'rgba(255,255,255,0.62)', textAlign: 'center' },
});
