/**
 * Local, on-device persistence for Alamara.
 *
 * The vault index (documents + tickets) lives as a single JSON file, and each
 * captured page (image/PDF) is copied out of its temporary picker location into a
 * permanent `blobs/` directory under the app's document directory. Nothing here
 * touches the network — everything stays on the phone.
 *
 * Uses the classic (legacy) expo-file-system functional API, which is fully
 * supported inside Expo Go. (The new class-based File/Directory API needs native
 * support that the Expo Go SDK 57 binary doesn't expose — its constructor throws
 * "this.validatePath is undefined".) During the native build phase this whole
 * layer is swapped for op-sqlite (SQLCipher + FTS5) + AES-GCM blob encryption,
 * without changing the `db` surface that feature code consumes.
 */

import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import type { Document, Ticket } from '@/types/models';

export interface VaultData {
  documents: Document[];
  tickets: Ticket[];
}

const ROOT = documentDirectory ?? '';
const BLOBS_DIR = `${ROOT}blobs/`;
const INDEX_FILE = `${ROOT}vault-index.json`;

async function ensureBlobsDir(): Promise<void> {
  const info = await getInfoAsync(BLOBS_DIR);
  if (!info.exists) await makeDirectoryAsync(BLOBS_DIR, { intermediates: true });
}

export async function readVault(): Promise<VaultData> {
  const info = await getInfoAsync(INDEX_FILE);
  if (!info.exists) return { documents: [], tickets: [] };
  try {
    const parsed = JSON.parse(await readAsStringAsync(INDEX_FILE)) as Partial<VaultData>;
    return { documents: parsed.documents ?? [], tickets: parsed.tickets ?? [] };
  } catch {
    // Corrupt or partial write — start clean rather than crash.
    return { documents: [], tickets: [] };
  }
}

export async function writeVault(data: VaultData): Promise<void> {
  await writeAsStringAsync(INDEX_FILE, JSON.stringify(data));
}

/** File extension (with dot) derived from a URI, defaulting to `.jpg`. */
function extOf(uri: string): string {
  const clean = uri.split('?')[0];
  const dot = clean.lastIndexOf('.');
  const ext = dot >= 0 ? clean.slice(dot) : '';
  return /^\.[a-zA-Z0-9]{1,5}$/.test(ext) ? ext : '.jpg';
}

/**
 * Copies a picked file (a temporary picker/camera URI) into permanent storage and
 * returns the new persistent `file://` URI to store on the document.
 */
export async function persistBlob(srcUri: string, id: string): Promise<string> {
  await ensureBlobsDir();
  const dest = `${BLOBS_DIR}${id}${extOf(srcUri)}`;
  const info = await getInfoAsync(dest);
  if (info.exists) await deleteAsync(dest, { idempotent: true });
  await copyAsync({ from: srcUri, to: dest });
  return dest;
}

/** Best-effort deletion of a document's blob files. */
export async function deleteBlobs(uris: string[]): Promise<void> {
  for (const uri of uris) {
    if (!uri) continue;
    try {
      await deleteAsync(uri, { idempotent: true });
    } catch {
      // already gone — ignore
    }
  }
}
