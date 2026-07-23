/**
 * Capture chooser — presented as a modal card. Three real sources funnel into one
 * pipeline: camera scan, import from Photos, or import from Files. The picked file
 * is handed to the Review screen, which persists it into the vault.
 */

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaptureOption } from '@/components/capture/capture-option';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { Durations, StaggerMs } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { back, replaceWith } from '@/lib/nav';

export default function CaptureScreen() {
  const theme = useTheme();
  const reduced = useReducedMotion();

  // Hand the picked file(s) to Review (replace so closing Review returns to the tab).
  const toReview = (uris: string[], source: string) => {
    if (uris.length === 0) return;
    replaceWith('/review', { uris: JSON.stringify(uris), source });
  };

  // Alamara's own camera screen (framing guide, auto-scan, then crop).
  const scan = () => replaceWith('/camera', {});

  const fromPhotos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!res.canceled) toReview(res.assets.map((a) => a.uri), 'Photos');
  };

  const fromFiles = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
      multiple: true,
    });
    if (!res.canceled && res.assets) toReview(res.assets.map((a) => a.uri), 'Files');
  };

  const options = [
    {
      icon: 'camera' as const,
      title: 'Scan a document',
      subtitle: 'Camera with auto edge-detection and crop',
      category: 'id' as const,
      onPress: scan,
    },
    {
      icon: 'folder' as const,
      title: 'Import from Files',
      subtitle: 'Pick a PDF or image from your files',
      category: 'pan' as const,
      onPress: fromFiles,
    },
    {
      icon: 'image' as const,
      title: 'Import from Photos',
      subtitle: 'Choose one or more existing photos',
      category: 'ticket' as const,
      onPress: fromPhotos,
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
      <View style={styles.grabberWrap}>
        <View style={[styles.grabber, { backgroundColor: theme.border }]} />
      </View>

      <View style={styles.content}>
        <View style={styles.heading}>
          <AppText variant="title">Add a document</AppText>
          <AppText variant="caption" color="textSecondary" style={styles.sub}>
            Pick a source. Everything stays on your device.
          </AppText>
        </View>

        <View style={styles.options}>
          {options.map((o, i) => (
            <Animated.View
              key={o.title}
              entering={
                reduced
                  ? FadeIn.duration(Durations.enter)
                  : FadeInDown.delay(i * StaggerMs).duration(Durations.enter)
              }
            >
              <CaptureOption {...o} />
            </Animated.View>
          ))}
        </View>

        <Button title="Cancel" variant="secondary" onPress={back} style={styles.cancel} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  grabberWrap: { alignItems: 'center', paddingTop: Spacing.md },
  grabber: { width: 40, height: 5, borderRadius: Radius.pill },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  heading: { marginBottom: Spacing.lg },
  sub: { marginTop: Spacing.xs },
  options: { gap: Spacing.md },
  cancel: { marginTop: 'auto', marginBottom: Spacing.base },
});
