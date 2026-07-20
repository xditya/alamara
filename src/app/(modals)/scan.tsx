/**
 * Scan — full-screen MOCK document scanner. An intentionally dark "viewfinder"
 * surface (design exception: not themed light/dark) with an animated framing
 * overlay, a shutter, a page-thumbnails strip, and a device-build note.
 *
 * TODO(device): react-native-vision-camera (live preview + document detection).
 */

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScanOverlay } from '@/components/capture/scan-overlay';
import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Radius, Spacing } from '@/constants/theme';
import { back, go } from '@/lib/nav';

// The scanner is a deliberately dark camera surface — these local constants are
// the one place raw colors are used, since the viewfinder never follows the theme.
const SCAN_BG = '#0A0A0C';
const ON_DARK = '#FFFFFF';
const ON_DARK_DIM = 'rgba(255,255,255,0.62)';
const CONTROL_BG = 'rgba(255,255,255,0.12)';
const THUMB_BG = 'rgba(255,255,255,0.06)';
const THUMB_BORDER = 'rgba(255,255,255,0.16)';

export default function ScanScreen() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <PressableScale onPress={back} style={styles.control} hitSlop={8}>
            <Icon name="close" size={22} color={ON_DARK} />
          </PressableScale>
          <AppText variant="section" style={{ color: ON_DARK }}>
            Scan document
          </AppText>
          <View style={styles.control} />
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinder}>
          <ScanOverlay />
          <View style={styles.captionWrap} pointerEvents="none">
            <AppText variant="caption" style={[styles.caption, { color: ON_DARK_DIM }]}>
              Position the document within the frame
            </AppText>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.footer}>
          <View style={styles.thumbs}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[styles.thumb, { backgroundColor: THUMB_BG, borderColor: THUMB_BORDER }]}
              >
                <Icon name="image" size={18} color={ON_DARK_DIM} />
              </View>
            ))}
            <AppText variant="caption" style={[styles.thumbsLabel, { color: ON_DARK_DIM }]}>
              No pages yet
            </AppText>
          </View>

          <View style={styles.shutterRow}>
            <PressableScale onPress={() => go('/review')} style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </PressableScale>
          </View>

          <AppText variant="caption" style={[styles.note, { color: ON_DARK_DIM }]}>
            Live camera requires a device build
          </AppText>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: SCAN_BG },
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
  viewfinder: { flex: 1 },
  captionWrap: { position: 'absolute', left: 0, right: 0, bottom: Spacing.xl, alignItems: 'center' },
  caption: { textAlign: 'center' },
  footer: { paddingBottom: Spacing.base, paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  thumbs: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbsLabel: { marginLeft: Spacing.xs },
  shutterRow: { alignItems: 'center' },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: Radius.pill,
    borderWidth: 4,
    borderColor: ON_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: Radius.pill,
    backgroundColor: ON_DARK,
  },
  note: { textAlign: 'center' },
});
