/** Maps each document category to a Feather icon from the shared `ui/Icon` set. */

import type { IconName } from '@/components/ui/icon';
import type { DocCategory } from '@/types/models';

export const CATEGORY_ICONS: Record<DocCategory, IconName> = {
  aadhaar: 'shield',
  pan: 'file',
  id: 'tag',
  ticket: 'calendar',
  certificate: 'star',
  other: 'folder',
};
