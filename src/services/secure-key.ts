/**
 * Master key for the encrypted database. A 256-bit random key is generated once and
 * kept in the OS secure store (Android Keystore / iOS Keychain) — it never leaves
 * the device and is never written to disk in plaintext.
 */

import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_ID = 'alamara.db.key.v1';

export async function getDatabaseKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(KEY_ID);
  if (!key) {
    const bytes = Crypto.getRandomBytes(32);
    key = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    await SecureStore.setItemAsync(KEY_ID, key);
  }
  return key;
}
