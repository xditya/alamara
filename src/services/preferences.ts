/**
 * User preferences, persisted on-device as a small JSON file (separate from the
 * document vault). Holds the theme choice, the one-time onboarding flag, the
 * biometric-lock opt-in, and any custom category names. Fully local.
 */

import {
  documentDirectory,
  getInfoAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

export type ThemeChoice = 'system' | 'light' | 'dark';

export interface Preferences {
  theme: ThemeChoice;
  onboarded: boolean;
  /** Opt-in: require biometric/device auth on launch. */
  biometricLock: boolean;
  /** User-added category names (beyond the built-in six). */
  customCategories: string[];
  /** Opt-in: on-device semantic search (downloads the embedding model). */
  aiEnabled: boolean;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  onboarded: false,
  biometricLock: false,
  customCategories: [],
  aiEnabled: false,
};

const FILE = `${documentDirectory ?? ''}preferences.json`;

export async function loadPreferences(): Promise<Preferences> {
  try {
    const info = await getInfoAsync(FILE);
    if (!info.exists) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(await readAsStringAsync(FILE)) as Partial<Preferences>;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  await writeAsStringAsync(FILE, JSON.stringify(prefs));
}
