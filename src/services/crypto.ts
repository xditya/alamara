/**
 * At-rest file encryption. MOCK (pass-through) for now — later AES-256-GCM with a master
 * key in Keychain/Keystore. Feature code must go through this interface, never touch files raw.
 */

export function encryptFile(uri: string): Promise<string> {
  return Promise.resolve(uri);
}

export function decryptToCache(path: string): Promise<string> {
  return Promise.resolve(path);
}
