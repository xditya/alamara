/**
 * Biometric app-lock. MOCK for now — later expo-local-authentication (Face ID / fingerprint)
 * gating release of the DB key. Feature code (lock screen) must go through this interface.
 */

export function isAvailable(): Promise<boolean> {
  return Promise.resolve(true);
}

export function authenticate(): Promise<boolean> {
  return Promise.resolve(true);
}
