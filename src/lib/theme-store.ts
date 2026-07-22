/**
 * Global preferences store (React external store). Backs the theme choice,
 * onboarding flag, biometric-lock opt-in, and custom categories, persisting every
 * change through `services/preferences`. Components read it with `usePreferences()`;
 * launch-gate logic reads the synchronous snapshot via `getPreferences()`.
 */

import { useSyncExternalStore } from 'react';

import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  savePreferences,
  type Preferences,
  type ThemeChoice,
} from '@/services/preferences';

let state: Preferences = { ...DEFAULT_PREFERENCES };
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function getSnapshot() {
  return state;
}

/** Load persisted preferences once at launch. */
export async function initPreferences(): Promise<void> {
  state = await loadPreferences();
  loaded = true;
  emit();
}

export function isPreferencesLoaded() {
  return loaded;
}

/** Synchronous snapshot for non-hook callers (e.g. the launch gate). */
export function getPreferences(): Preferences {
  return state;
}

function update(patch: Partial<Preferences>) {
  state = { ...state, ...patch };
  emit();
  void savePreferences(state);
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function setThemeChoice(theme: ThemeChoice) {
  update({ theme });
}
export function setOnboarded(onboarded: boolean) {
  update({ onboarded });
}
export function setBiometricLock(biometricLock: boolean) {
  update({ biometricLock });
}
export function setCustomCategories(customCategories: string[]) {
  update({ customCategories });
}
