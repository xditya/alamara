import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily } from '@/constants/fonts';
import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Variant = 'greeting' | 'title' | 'section' | 'body' | 'caption' | 'label' | 'mono';

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: ThemeColor;
};

export function AppText({ variant = 'body', color = 'text', style, ...rest }: AppTextProps) {
  const theme = useTheme();
  return <Text style={[{ color: theme[color] }, styles[variant], style]} {...rest} />;
}

const styles = StyleSheet.create({
  greeting: { fontFamily: FontFamily.semibold, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: FontFamily.bold, fontSize: 22, lineHeight: 28 },
  section: { fontFamily: FontFamily.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: FontFamily.medium, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: FontFamily.medium, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: FontFamily.semibold, fontSize: 13, lineHeight: 16 },
  mono: { fontFamily: FontFamily.mono, fontSize: 16, lineHeight: 22 },
});
