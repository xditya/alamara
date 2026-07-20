/**
 * In-memory launch-gate state (resets on every app reload). Drives "onboard once, then
 * biometric-lock on launch" without persistence. Real persistence — an encrypted
 * onboarded flag + expo-secure-store — is a native TODO(device).
 */
export const session = {
  onboarded: false,
  unlocked: false,
};
