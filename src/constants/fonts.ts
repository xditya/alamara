/**
 * Plus Jakarta Sans (loaded in the root layout) + a platform monospace for ID numbers.
 */

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Platform } from 'react-native';

/** Passed to `useFonts()` in the root layout. */
export const FontAssets = {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
};

export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
};
