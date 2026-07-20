/**
 * The center "＋" capture action. Rendered once at the root and overlaid above the tab bar;
 * shows only on the (tabs) routes. Opens the capture chooser modal.
 */

import { useSegments } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { go } from '@/lib/nav';
import { useTheme } from '@/hooks/use-theme';

export function FloatingCaptureButton() {
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const onTabs = (segments[0] as string) === '(tabs)';
  if (!onTabs) return null;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Add a document"
      onPress={() => go('/capture')}
      style={[styles.btn, { backgroundColor: theme.primary, bottom: insets.bottom + 28 }]}
    >
      <Icon name="plus" size={26} color={theme.onPrimary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
