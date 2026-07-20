/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Alamara "Soft & Friendly" semantic palette.
 * Legacy keys (background/backgroundElement/backgroundSelected) are retained so the
 * scaffold screens keep working while screens are migrated to the semantic tokens.
 */
export const Colors = {
  light: {
    // Legacy aliases (kept for scaffold screens + native tabs)
    text: '#16181D',
    background: '#FFFFFF',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#6B7280',
    // Semantic surfaces
    bg: '#FFFFFF',
    bgGrouped: '#F6F7F9',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#ECEDF0',
    // Action
    primary: '#6366F1',
    onPrimary: '#FFFFFF',
    primaryMuted: '#EEF0FE',
    // Status
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
  },
  dark: {
    // Legacy aliases
    text: '#F5F6F8',
    background: '#0B0B0F',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#9CA1AC',
    // Semantic surfaces
    bg: '#0B0B0F',
    bgGrouped: '#000000',
    surface: '#16171C',
    surfaceElevated: '#1D1E24',
    border: '#26272E',
    // Action
    primary: '#818CF8',
    onPrimary: '#0B0B0F',
    primaryMuted: '#1B1B33',
    // Status
    success: '#22C55E',
    warning: '#FBBF24',
    danger: '#F87171',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Document categories that drive per-category tinting across the app. */
export type DocCategory = 'aadhaar' | 'pan' | 'id' | 'ticket' | 'certificate' | 'other';

/** Pastel `tint` (surface) + `fg` (text/icon) pair per category, per scheme. */
export const CategoryColors: Record<'light' | 'dark', Record<DocCategory, { tint: string; fg: string }>> = {
  light: {
    aadhaar: { tint: '#E6F4EA', fg: '#1E8E5A' },
    pan: { tint: '#E7F0FD', fg: '#2563EB' },
    id: { tint: '#EEE9FE', fg: '#7C3AED' },
    ticket: { tint: '#FFF1E6', fg: '#EA580C' },
    certificate: { tint: '#E4F5F4', fg: '#0D9488' },
    other: { tint: '#F1F2F4', fg: '#6B7280' },
  },
  dark: {
    aadhaar: { tint: '#122A1E', fg: '#4ADE80' },
    pan: { tint: '#0E1E38', fg: '#60A5FA' },
    id: { tint: '#20153A', fg: '#A78BFA' },
    ticket: { tint: '#361A0C', fg: '#FB923C' },
    certificate: { tint: '#0C2A28', fg: '#2DD4BF' },
    other: { tint: '#1C1D22', fg: '#9CA1AC' },
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  // Legacy scale (kept for scaffold screens)
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  // Semantic scale
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

/** Corner radii — rounded, "soft & friendly" geometry. */
export const Radius = {
  input: 14,
  button: 16,
  card: 20,
  sheet: 28,
  pill: 999,
} as const;

/**
 * Soft single-shadow elevation for cards. Light mode uses a diffuse shadow;
 * dark mode leans on the `border` token instead (shadows read poorly on OLED).
 */
export const CardShadow = {
  light: {
    shadowColor: '#0B0B0F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
  dark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
