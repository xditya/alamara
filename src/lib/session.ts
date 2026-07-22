/**
 * Per-launch session state (resets on every app restart). Only `unlocked` lives
 * here — it is intentionally NOT persisted, so the biometric lock re-challenges on
 * each launch. The persistent `onboarded` flag and the `biometricLock` opt-in live
 * in the preferences store (see `lib/theme-store`).
 */
export const session = {
  unlocked: false,
};
