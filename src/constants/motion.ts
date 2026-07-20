/**
 * Alamara motion system — Emil Kowalski's animation principles translated to
 * Reanimated 4. Animate `transform` + `opacity` only (UI thread, 60fps).
 *
 * Rules baked in here:
 * - Durations stay under 300ms; exits are faster than enters.
 * - Never `ease-in` for UI: enter/exit use `out`, on-screen morphs use `inOut`.
 * - Springs (not keyframes) for anything interruptible / gesture-driven.
 */

import { Easing } from 'react-native-reanimated';

/** Custom easing curves. `out` is the default for enter/exit. */
export const Easings = {
  /** Enter/exit — starts fast, settles gently. cubic-bezier(0.23, 1, 0.32, 1). */
  out: Easing.bezier(0.23, 1, 0.32, 1),
  /** On-screen move/morph — cubic-bezier(0.77, 0, 0.175, 1). */
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  /** Sheets/drawers — cubic-bezier(0.32, 0.72, 0, 1). */
  drawer: Easing.bezier(0.32, 0.72, 0, 1),
} as const;

/** Durations in ms. All under 300ms; exit variants intentionally shorter. */
export const Durations = {
  press: 120,
  chip: 160,
  popover: 180,
  menu: 220,
  enter: 200,
  exit: 160,
  page: 260,
  sheetIn: 300,
  sheetOut: 240,
} as const;

/** Spring configs (Reanimated `withSpring`). Bounce kept subtle. */
export const Springs = {
  /** Press feedback, toggles — quick with a touch of life. */
  snappy: { stiffness: 320, damping: 30, mass: 1 },
  /** Sheets, wallet cards, drag — softer, momentum-friendly. */
  gentle: { mass: 0.9, stiffness: 220, damping: 26 },
} as const;

/** Per-item delay for staggered list/grid entry (decorative only). */
export const StaggerMs = 40;
