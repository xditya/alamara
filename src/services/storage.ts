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
  cacheDirectory,
  copyAsync,
  deleteAsync,
  documentDirectory,
  getFreeDiskStorageAsync,
  getInfoAsync,
  getTotalDiskCapacityAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  readDirectoryAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import { kvGet, kvSet } from '@/services/sqlite';
import type { Document, Ticket } from '@/types/models';

export interface VaultData {
  documents: Document[];
  tickets: Ticket[];
}

const ROOT = documentDirectory ?? '';
const BLOBS_DIR = `${ROOT}blobs/`;
const INDEX_FILE = `${ROOT}vault-index.json`; // legacy plaintext index (migrated away)
const VAULT_KEY = 'vault';

async function ensureBlobsDir(): Promise<void> {
  const info = await getInfoAsync(BLOBS_DIR);
  if (!info.exists) await makeDirectoryAsync(BLOBS_DIR, { intermediates: true });
}

export async function readVault(): Promise<VaultData> {
  // Encrypted store (SQLCipher) is the source of truth.
  try {
    const raw = await kvGet(VAULT_KEY);
    if (raw != null) {
      const parsed = JSON.parse(raw) as Partial<VaultData>;
      return { documents: parsed.documents ?? [], tickets: parsed.tickets ?? [] };
    }
  } catch {
    // fall through to migration / empty
  }
  // One-time migration: fold a legacy plaintext JSON index into the encrypted DB,
  // then delete the plaintext copy.
  try {
    const info = await getInfoAsync(INDEX_FILE);
    if (info.exists) {
      const parsed = JSON.parse(await readAsStringAsync(INDEX_FILE)) as Partial<VaultData>;
      const data = { documents: parsed.documents ?? [], tickets: parsed.tickets ?? [] };
      await kvSet(VAULT_KEY, JSON.stringify(data));
      await deleteAsync(INDEX_FILE, { idempotent: true });
      return data;
    }
  } catch {
    // ignore — start clean
  }
  return { documents: [], tickets: [] };
}

export async function writeVault(data: VaultData): Promise<void> {
  await kvSet(VAULT_KEY, JSON.stringify(data));
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

export interface StorageUsage {
  /** Bytes used by the vault index + all page blobs. */
  used: number;
  /** Free bytes on the device. */
  free: number;
  /** Total device capacity in bytes. */
  total: number;
  /** Number of stored blob files. */
  blobCount: number;
}

/** Real on-device usage: sum of the index file and every blob, plus device totals. */
export async function getStorageUsage(): Promise<StorageUsage> {
  let used = 0;
  let blobCount = 0;
  try {
    const raw = await kvGet(VAULT_KEY);
    if (raw) used += raw.length;
  } catch {
    // ignore
  }
  try {
    const dir = await getInfoAsync(BLOBS_DIR);
    if (dir.exists) {
      const names = await readDirectoryAsync(BLOBS_DIR);
      for (const name of names) {
        const info = await getInfoAsync(`${BLOBS_DIR}${name}`);
        if (info.exists && info.size) {
          used += info.size;
          blobCount += 1;
        }
      }
    }
  } catch {
    // ignore
  }
  const [free, total] = await Promise.all([
    getFreeDiskStorageAsync().catch(() => 0),
    getTotalDiskCapacityAsync().catch(() => 0),
  ]);
  return { used, free, total, blobCount };
}

/** Total bytes currently held in the cache directory (decoded previews, temp files). */
export async function getCacheSize(): Promise<number> {
  const cache = cacheDirectory;
  if (!cache) return 0;
  let total = 0;
  try {
    const names = await readDirectoryAsync(cache);
    for (const name of names) {
      const info = await getInfoAsync(`${cache}${name}`);
      if (info.exists && info.size) total += info.size;
    }
  } catch {
    // ignore
  }
  return total;
}

/** Clears cached previews/temp files. The vault (documents + blobs) is untouched. */
export async function clearCache(): Promise<void> {
  const cache = cacheDirectory;
  if (!cache) return;
  try {
    const names = await readDirectoryAsync(cache);
    for (const name of names) {
      try {
        await deleteAsync(`${cache}${name}`, { idempotent: true });
      } catch {
        // in-use file — skip
      }
    }
  } catch {
    // ignore
  }
}

/** Writes the current vault to a shareable JSON backup file and returns its URI. */
export async function exportVault(): Promise<string> {
  const data = await readVault();
  const dest = `${cacheDirectory ?? ROOT}alamara-backup.json`;
  await writeAsStringAsync(dest, JSON.stringify(data, null, 2));
  return dest;
}

/** Merges a backup file into the vault (new ids only) and returns how many were added. */
export async function importVault(uri: string): Promise<{ documents: number; tickets: number }> {
  const incoming = JSON.parse(await readAsStringAsync(uri)) as Partial<VaultData>;
  const current = await readVault();
  const docIds = new Set(current.documents.map((d) => d.id));
  const ticketIds = new Set(current.tickets.map((t) => t.id));
  const newDocs = (incoming.documents ?? []).filter((d) => d && d.id && !docIds.has(d.id));
  const newTickets = (incoming.tickets ?? []).filter((t) => t && t.id && !ticketIds.has(t.id));
  if (newDocs.length || newTickets.length) {
    await writeVault({
      documents: [...current.documents, ...newDocs],
      tickets: [...current.tickets, ...newTickets],
    });
  }
  return { documents: newDocs.length, tickets: newTickets.length };
}
