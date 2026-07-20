/**
 * Capture chooser — presented as a modal card. Three sources funnel into one
 * pipeline: live scan (→ /scan) or import from Files/Photos (simulated → /review).
 */

import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CaptureOption } from '@/components/capture/capture-option';
import { Button } from '@/components/ui/button';
import { AppText } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { Durations, StaggerMs } from '@/constants/motion';
import { Radius, Spacing } from '@/constants/theme';
import { useReducedMotion } from '@/hooks/use-reduced-motion';
import { useTheme } from '@/hooks/use-theme';
import { back, go } from '@/lib/nav';

export default function CaptureScreen() {
  const theme = useTheme();
  const toast = useToast();
  const reduced = useReducedMotion();

  // Imports use native pickers on device; here we simulate then hand off to Review.
  // TODO(device): expo-document-picker (Files) / expo-image-picker (Photos)
  const simulateImport = (source: string) => {
    toast.show(`Importing from ${source}…`);
    go('/review');
  };

  const options = [
    {
      icon: 'camera' as const,
      title: 'Scan a document',
      subtitle: 'Use the camera to capture pages',
      category: 'id' as const,
      onPress: () => go('/scan'),
    },
    {
      icon: 'folder' as const,
      title: 'Import from Files',
      subtitle: 'Pick a PDF or image from your files',
      category: 'pan' as const,
      onPress: () => simulateImport('Files'),
    },
    {
      icon: 'image' as const,
      title: 'Import from Photos',
      subtitle: 'Choose an existing photo',
      category: 'ticket' as const,
      onPress: () => simulateImport('Photos'),
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['bottom']}>
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
