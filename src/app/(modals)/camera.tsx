/**
 * Capture — Alamara's own camera screen.
 *
 * A dark viewfinder with a framing guide, a shutter, and an "Auto-scan" action
 * that hands off to the on-device ML Kit document scanner for real edge detection
 * and automatic cropping. Either path lands on the Crop screen, so the user always
 * gets a chance to adjust before saving.
 */

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import DocumentScanner, { ResponseType } from 'react-native-document-scanner-plugin';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Radius, Spacing } from '@/constants/theme';
import { back, replaceWith } from '@/lib/nav';

// The viewfinder is a deliberately dark surface — the one place raw colours are used.
const SCAN_BG = '#0A0A0C';
const ON_DARK = '#FFFFFF';
const ON_DARK_DIM = 'rgba(255,255,255,0.62)';
const CONTROL_BG = 'rgba(255,255,255,0.12)';
const FRAME = 'rgba(255,255,255,0.5)';

export default function CameraScreen() {
  const toast = useToast();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [busy, setBusy] = useState(false);

  const toCrop = (uri: string, source: string) =>
    replaceWith('/crop', { uri, source });

  const shoot = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) toCrop(photo.uri, 'Camera');
      else setBusy(false);
    } catch {
      setBusy(false);
      toast.show('Could not take that photo');
    }
  };

  /** ML Kit document scanner: detects the page edges and auto-crops. */
  const autoScan = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
        croppedImageQuality: 100,
        responseType: ResponseType.ImageFilePath,
      });
      const first = scannedImages?.[0];
      if (first) toCrop(first, 'Scan');
      else setBusy(false);
    } catch {
      setBusy(false);
      toast.show('Auto-scan is unavailable on this device');
    }
  };

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <StatusBar style="light" />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <PressableScale onPress={back} style={styles.control} hitSlop={8}>
              <Icon name="close" size={22} color={ON_DARK} />
            </PressableScale>
            <AppText variant="section" style={{ color: ON_DARK }}>
              Scan document
            </AppText>
            <View style={styles.control} />
          </View>
          <View style={styles.permission}>
            <Icon name="camera" size={44} color={ON_DARK_DIM} />
            <AppText variant="title" style={{ color: ON_DARK }}>
              Camera access needed
            </AppText>
            <AppText variant="body" style={[styles.hint, styles.permissionText]}>
              Alamara uses the camera to scan documents. Nothing leaves your device.
            </AppText>
            <Button title="Allow camera" icon="camera" onPress={() => void requestPermission()} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.header}>
          <PressableScale onPress={back} style={styles.control} hitSlop={8} accessibilityLabel="Close">
            <Icon name="close" size={22} color={ON_DARK} />
          </PressableScale>
          <AppText variant="section" style={{ color: ON_DARK }}>
            Scan document
          </AppText>
          <PressableScale
            onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
            style={styles.control}
            hitSlop={8}
            accessibilityLabel="Toggle flash"
          >
            <Icon name={flash === 'on' ? 'sun' : 'moon'} size={20} color={ON_DARK} />
          </PressableScale>
        </View>

        {/* Framing guide */}
        <View style={styles.frameWrap} pointerEvents="none">
          <View style={styles.frame} />
          <AppText variant="caption" style={styles.hint}>
            Fit the document inside the frame
          </AppText>
        </View>

        <View style={styles.footer}>
          <PressableScale
            onPress={autoScan}
            style={[styles.autoBtn, { backgroundColor: CONTROL_BG }]}
            accessibilityLabel="Auto-scan with edge detection"
          >
            <Icon name="scan" size={18} color={ON_DARK} />
            <AppText variant="label" style={{ color: ON_DARK }}>
              Auto-scan
            </AppText>
          </PressableScale>

          <PressableScale
            onPress={shoot}
            style={styles.shutterOuter}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
          >
            <View style={styles.shutterInner} />
          </PressableScale>

          <View style={styles.autoBtnSpacer} />
        </View>

        <AppText variant="caption" style={[styles.hint, styles.footerNote]}>
          Auto-scan finds the page edges and crops for you
        </AppText>
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
  frameWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.base },
  frame: {
    width: '82%',
    aspectRatio: 0.72,
    borderWidth: 2,
    borderColor: FRAME,
    borderRadius: Radius.card,
  },
  hint: { color: ON_DARK_DIM, textAlign: 'center' },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.base, paddingHorizontal: Spacing.xl },
  permissionText: { marginBottom: Spacing.sm },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  autoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
    minWidth: 120,
    justifyContent: 'center',
  },
  autoBtnSpacer: { minWidth: 120 },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: Radius.pill,
    borderWidth: 4,
    borderColor: ON_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: { width: 58, height: 58, borderRadius: Radius.pill, backgroundColor: ON_DARK },
  footerNote: { paddingBottom: Spacing.md, paddingTop: Spacing.sm },
});
