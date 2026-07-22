/**
 * Biometric app-lock, backed by expo-local-authentication (Face ID / fingerprint,
 * with device-passcode fallback). The lock screen and Security settings go through
 * this interface.
 */

import * as LocalAuthentication from 'expo-local-authentication';

/** True when the device can actually authenticate the user (biometrics enrolled). */
export async function isAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

/**
 * Prompts for biometric / device-passcode auth. Returns true on success. If the
 * device has no biometrics AND no passcode configured, it "fails open" so the user
 * can never be permanently locked out of their own local vault.
 */
export async function authenticate(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return true;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Alamara',
      cancelLabel: 'Cancel',
    });
    if (result.success) return true;

    // No enrolled biometric and no device passcode → nothing to authenticate against.
    const openErrors = ['not_enrolled', 'not_available', 'passcode_not_set'];
    if (result.error && openErrors.includes(result.error)) return true;

    return false;
  } catch {
    return false;
  }
}
