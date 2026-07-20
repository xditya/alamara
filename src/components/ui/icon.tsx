/** SVG icon wrapper over @expo/vector-icons Feather (bundled with Expo, no native config). */

import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

const MAP = {
  home: 'home',
  folder: 'folder',
  wallet: 'credit-card',
  settings: 'settings',
  search: 'search',
  plus: 'plus',
  camera: 'camera',
  image: 'image',
  file: 'file-text',
  scan: 'maximize',
  check: 'check',
  close: 'x',
  chevronRight: 'chevron-right',
  chevronLeft: 'chevron-left',
  copy: 'copy',
  share: 'share-2',
  trash: 'trash-2',
  edit: 'edit-2',
  calendar: 'calendar',
  clock: 'clock',
  bell: 'bell',
  lock: 'lock',
  shield: 'shield',
  tag: 'tag',
  star: 'star',
  download: 'download',
  upload: 'upload',
  grid: 'grid',
  list: 'list',
  filter: 'filter',
  alert: 'alert-circle',
  info: 'info',
  sun: 'sun',
  moon: 'moon',
  cpu: 'cpu',
  database: 'database',
  eye: 'eye',
  arrowLeft: 'arrow-left',
  arrowRight: 'arrow-right',
  sliders: 'sliders',
  plusCircle: 'plus-circle',
  refresh: 'refresh-cw',
  maximize: 'maximize-2',
} satisfies Record<string, FeatherName>;

export type IconName = keyof typeof MAP;

export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  /** A theme token key (e.g. 'primary') or a raw color string. Defaults to `text`. */
  color?: ThemeColor | string;
}) {
  const theme = useTheme();
  const resolved =
    color && color in theme ? theme[color as ThemeColor] : (color as string | undefined) ?? theme.text;
  return <Feather name={MAP[name]} size={size} color={resolved} />;
}
